import { useState, useEffect } from 'react';

// Undo/redo history for the PCR report editor. Tracks editableContent, section
// order/visibility, and which optional persona cards are shown.
export default function usePcrHistory({
  editableContent,
  setEditableContent,
  sectionVisibility,
  setSectionVisibility,
  sectionOrder,
  setSectionOrder,
  showEducatorCard,
  setShowEducatorCard,
  showThirdCard,
  setShowThirdCard,
  showFourthCard,
  setShowFourthCard,
  showFifthCard,
  setShowFifthCard,
  isEditMode,
  setIsPreviewCached,
}) {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = (content, visibility, order, showEducator, showThird, showFourth, showFifth) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify({
      content,
      sectionVisibility: visibility,
      sectionOrder: order,
      showEducatorCard: showEducator,
      showThirdCard: showThird,
      showFourthCard: showFourth,
      showFifthCard: showFifth,
    })));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Invalidate preview cache when content changes
    setIsPreviewCached(false);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setHistoryIndex(newIndex);
      setEditableContent(JSON.parse(JSON.stringify(state.content)));
      setSectionVisibility(JSON.parse(JSON.stringify(state.sectionVisibility)));
      setSectionOrder(JSON.parse(JSON.stringify(state.sectionOrder)));
      setShowEducatorCard(state.showEducatorCard);
      setShowThirdCard(state.showThirdCard);
      setShowFourthCard(state.showFourthCard || false);
      setShowFifthCard(state.showFifthCard || false);

      // Invalidate preview cache when undoing
      setIsPreviewCached(false);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setHistoryIndex(newIndex);
      setEditableContent(JSON.parse(JSON.stringify(state.content)));
      setSectionVisibility(JSON.parse(JSON.stringify(state.sectionVisibility)));
      setSectionOrder(JSON.parse(JSON.stringify(state.sectionOrder)));
      setShowEducatorCard(state.showEducatorCard);
      setShowThirdCard(state.showThirdCard);
      setShowFourthCard(state.showFourthCard || false);
      setShowFifthCard(state.showFifthCard || false);
    }
  };

  // Track changes for undo/redo
  useEffect(() => {
    if (isEditMode && history.length === 0) {
      saveToHistory(editableContent, sectionVisibility, sectionOrder, showEducatorCard, showThirdCard, showFourthCard, showFifthCard);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode || history.length === 0) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      const lastState = history[historyIndex];
      const currentState = {
        content: editableContent,
        sectionVisibility,
        sectionOrder,
        showEducatorCard,
        showThirdCard,
        showFourthCard,
        showFifthCard,
      };

      if (JSON.stringify(lastState) !== JSON.stringify(currentState)) {
        saveToHistory(editableContent, sectionVisibility, sectionOrder, showEducatorCard, showThirdCard, showFourthCard, showFifthCard);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableContent, sectionVisibility, sectionOrder, showEducatorCard, showThirdCard, showFourthCard, showFifthCard, isEditMode]);

  const resetHistory = () => {
    setHistory([]);
    setHistoryIndex(-1);
  };

  return { history, historyIndex, handleUndo, handleRedo, resetHistory };
}
