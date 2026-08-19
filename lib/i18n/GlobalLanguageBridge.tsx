"use client";

import { useEffect } from "react";
import { thaiToEnglish } from "./locales/global";

const THAI = /[\u0E00-\u0E7F]/;
const translatedText = new WeakMap<Text, string>();
const translatedAttributes = new WeakMap<Element, Map<string, string>>();
const attributes = ["placeholder", "title", "aria-label", "alt"] as const;
const entries = Object.entries(thaiToEnglish).sort(([a], [b]) => b.length - a.length);

function translate(value: string) {
  if (!THAI.test(value)) return value;
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  let result = value.trim();

  for (const [thai, english] of entries) {
    if (result.includes(thai)) result = result.split(thai).join(english);
  }
  return leading + result + trailing;
}

function visit(root: Node, language: "th" | "en") {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  if (root.nodeType === Node.TEXT_NODE) nodes.push(root as Text);
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent || ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) continue;
    if (language === "en") {
      if (!THAI.test(node.data)) continue;
      translatedText.set(node, node.data);
      node.data = translate(node.data);
    } else {
      const original = translatedText.get(node);
      if (original !== undefined) {
        node.data = original;
        translatedText.delete(node);
      }
    }
  }

  const elements: Element[] = [];
  if (root.nodeType === Node.ELEMENT_NODE) elements.push(root as Element);
  elements.push(...Array.from((root as ParentNode).querySelectorAll?.("*") ?? []));
  for (const element of elements) {
    for (const attribute of attributes) {
      const value = element.getAttribute(attribute);
      if (language === "en" && value && THAI.test(value)) {
        let originals = translatedAttributes.get(element);
        if (!originals) {
          originals = new Map();
          translatedAttributes.set(element, originals);
        }
        if (!originals.has(attribute)) originals.set(attribute, value);
        element.setAttribute(attribute, translate(value));
      } else if (language === "th") {
        const original = translatedAttributes.get(element)?.get(attribute);
        if (original !== undefined) element.setAttribute(attribute, original);
      }
    }
  }
}

export function GlobalLanguageBridge({ language }: { language: "th" | "en" }) {
  useEffect(() => {
    let applying = false;
    const apply = (root: Node) => {
      if (applying) return;
      applying = true;
      visit(root, language);
      applying = false;
    };

    apply(document.body);
    const observer = new MutationObserver((mutations) => {
      if (applying) return;
      for (const mutation of mutations) {
        if (mutation.type === "characterData") apply(mutation.target);
        for (const node of mutation.addedNodes) apply(node);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  return null;
}
