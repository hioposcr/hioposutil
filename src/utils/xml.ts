export function parseXmlDocument(xmlString: string): Document {
  const parser = new DOMParser();
  const document = parser.parseFromString(xmlString, 'application/xml');
  const parserError = document.getElementsByTagName('parsererror')[0];

  if (parserError) {
    throw new Error('El XML no es válido o no se pudo interpretar.');
  }

  return document;
}

export function serializeXmlDocument(document: Document): string {
  return new XMLSerializer().serializeToString(document);
}

export function getLocalName(node: Node | null): string {
  if (!node) {
    return '';
  }

  if ('localName' in node && typeof node.localName === 'string' && node.localName) {
    return node.localName;
  }

  return node.nodeName.split(':').pop() ?? node.nodeName;
}

export function findElementsByLocalName(root: Document | Element, localName: string): Element[] {
  const matches: Element[] = [];
  const base = root instanceof Document ? root.documentElement : root;

  if (getLocalName(base) === localName) {
    matches.push(base);
  }

  const descendants = Array.from(base.getElementsByTagName('*'));
  return matches.concat(descendants.filter((element) => getLocalName(element) === localName));
}

export function findFirstElementByLocalNames(
  root: Document | Element,
  localNames: string[]
): Element | null {
  for (const localName of localNames) {
    const found = findElementsByLocalName(root, localName)[0];
    if (found) {
      return found;
    }
  }

  return null;
}

export function getChildElement(parent: Element, localName: string): Element | null {
  return Array.from(parent.children).find((child) => getLocalName(child) === localName) ?? null;
}

export function getChildElements(parent: Element, localName: string): Element[] {
  return Array.from(parent.children).filter((child) => getLocalName(child) === localName);
}

export function getElementText(parent: Element, localName: string): string {
  return getChildElement(parent, localName)?.textContent?.trim() ?? '';
}

export function ensureChildElement(parent: Element, localName: string): Element {
  const current = getChildElement(parent, localName);
  if (current) {
    return current;
  }

  const namespace = parent.namespaceURI;
  const element = namespace
    ? parent.ownerDocument.createElementNS(namespace, localName)
    : parent.ownerDocument.createElement(localName);

  parent.appendChild(element);
  return element;
}

export function setElementText(parent: Element, localName: string, value: string): Element {
  const element = ensureChildElement(parent, localName);
  element.textContent = value;
  return element;
}
