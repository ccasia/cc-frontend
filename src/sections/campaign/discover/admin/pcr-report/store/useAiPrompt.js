import { create } from 'zustand';

export const useAiPrompt = create(() => ({
  prompt: new Map(),
}));

// export default useAiPrompt;

export const setPrompt = (section, val) =>
  useAiPrompt.setState((state) => {
    const next = new Map(state.prompt);
    next.set(section, val);

    return { prompt: next };
  });
