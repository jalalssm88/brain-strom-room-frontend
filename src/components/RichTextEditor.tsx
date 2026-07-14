'use client';

import { useEffect, useRef } from 'react';
import { getDisplayHtml, sanitizeRichHtml } from '@/lib/richText';
import styles from './RichTextEditor.module.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONT_STEP = 2;
const MIN_FONT = 10;
const MAX_FONT = 28;
const DEFAULT_FONT = 13;

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef('');

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const next = getDisplayHtml(value);
    if (next !== lastHtmlRef.current && document.activeElement !== editor) {
      editor.innerHTML = next || '';
      lastHtmlRef.current = next;
    }
  }, [value]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = sanitizeRichHtml(editor.innerHTML);
    lastHtmlRef.current = html;
    onChange(html === '<br>' ? '' : html);
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const adjustFontSize = (delta: number) => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;

    editor.focus();
    const range = selection.getRangeAt(0);

    if (range.collapsed) {
      const size = clampFont(DEFAULT_FONT + delta);
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      span.appendChild(document.createTextNode('\u200b'));
      range.insertNode(span);
      range.setStart(span.firstChild!, 1);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      emitChange();
      return;
    }

    const currentSize = getSelectionFontSize(selection) ?? DEFAULT_FONT;
    const nextSize = clampFont(currentSize + delta);
    const contents = range.extractContents();
    const span = document.createElement('span');
    span.style.fontSize = `${nextSize}px`;
    span.appendChild(contents);
    range.insertNode(span);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);
    emitChange();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar} role="toolbar" aria-label="Text formatting">
        <button type="button" className={styles.toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('bold')} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" className={styles.toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('insertUnorderedList')} title="Bullet list">
          • List
        </button>
        <button type="button" className={styles.toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('insertOrderedList')} title="Numbered list">
          1. List
        </button>
        <span className={styles.divider} />
        <button type="button" className={styles.toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => adjustFontSize(-FONT_STEP)} title="Decrease font size">
          A−
        </button>
        <button type="button" className={styles.toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => adjustFontSize(FONT_STEP)} title="Increase font size">
          A+
        </button>
      </div>

      <div
        ref={editorRef}
        className={styles.editor}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder ?? 'Content'}
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
      />
    </div>
  );
}

function clampFont(size: number): number {
  return Math.min(MAX_FONT, Math.max(MIN_FONT, size));
}

function getSelectionFontSize(selection: Selection): number | null {
  const node = selection.anchorNode;
  const el =
    node?.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : node?.parentElement;
  if (!el) return null;
  const px = Number.parseFloat(window.getComputedStyle(el).fontSize);
  return Number.isFinite(px) ? px : null;
}
