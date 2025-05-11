import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

/**
 * A reusable message input component with emoji selector, templates, and typing state
 */
const MessageInput = ({
  value,
  onChange,
  onSend,
  placeholder = "Type your message...",
  isLoading = false,
  templates = [],
  onTypingStateChange = () => {},
}) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  // Handle typing indicator with debounce
  useEffect(() => {
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTypingStateChange(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTypingStateChange(false);
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [value, isTyping, onTypingStateChange]);

  const handleKeyDown = (e) => {
    // Send message on Enter (but not with Shift+Enter which creates a new line)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend();
      }
    }
  };

  const handleTemplateClick = (template) => {
    onChange(template);

    // Focus the textarea after selecting a template
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="message-input-container border-t border-gray-200 p-4 bg-white">
      {/* Template buttons */}
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {templates.map((template, index) => (
            <button
              key={index}
              type="button"
              className="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              onClick={() => handleTemplateClick(template.text)}
            >
              {template.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] max-h-[150px]"
          placeholder={placeholder}
          rows="1"
        />

        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          className="ml-2 px-4 py-2 h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Optional character count */}
      {value.length > 0 && (
        <div className="flex justify-end mt-1">
          <span
            className={`text-xs ${value.length > 500 ? "text-red-500" : "text-gray-500"}`}
          >
            {value.length}/500
          </span>
        </div>
      )}
    </div>
  );
};

MessageInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  isLoading: PropTypes.bool,
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    }),
  ),
  onTypingStateChange: PropTypes.func,
};

export default MessageInput;
