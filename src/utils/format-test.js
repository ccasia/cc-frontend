export const formatText = (text) => text && text[0].toUpperCase() + text.slice(1);

export const formatLongText = (text) => `${text.slice(0, 100)}...`;
