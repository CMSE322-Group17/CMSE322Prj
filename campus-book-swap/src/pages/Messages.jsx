import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Hardcoded fallback data for conversations and messages
const HARDCODED_CONVERSATIONS = [
  {
    id: 'chat1',
    chatId: '1_2_101',
    bookTitle: 'Intro to Algorithms',
    lastMessage: {
      text: 'See you at the library!',
      createdAt: '2024-05-01T10:00:00Z',
      senderId: 2,
      receiverId: 1
    },
    otherUser: { id: 2, username: 'alice123' }
  }
];
const HARDCODED_MESSAGES = [
  {
    id: 1,
    chatId: '1_2_101',
    senderId: 1,
    receiverId: 2,
    text: 'Hi, is the book still available?',
    createdAt: '2024-05-01T09:55:00Z',
    isRead: true
  },
  {
    id: 2,
    chatId: '1_2_101',
    senderId: 2,
    receiverId: 1,
    text: 'Yes, it is!','createdAt': '2024-05-01T09:56:00Z',
    isRead: true
  },
  {
    id: 3,
    chatId: '1_2_101',
    senderId: 1,
    receiverId: 2,
    text: 'Great, can we meet at the library?',
    createdAt: '2024-05-01T09:58:00Z',
    isRead: true
  },
  {
    id: 4,
    chatId: '1_2_101',
    senderId: 2,
    receiverId: 1,
    text: 'See you at the library!',
    createdAt: '2024-05-01T10:00:00Z',
    isRead: false
  }
];

// Dummy components for fallback UI
const ConversationItem = ({ conversation, active, onClick }) => (
  <div
    className={`p-3 cursor-pointer ${active ? 'bg-blue-100' : ''}`}
    onClick={() => onClick(conversation)}
  >
    <div className="font-medium">{conversation.bookTitle}</div>
    <div className="text-xs text-gray-500">{conversation.lastMessage.text}</div>
  </div>
);
const MessageList = ({ messages, currentUser }) => (
  <div className="flex-1 overflow-y-auto p-4">
    {messages.map(msg => (
      <div key={msg.id} className={`mb-2 ${msg.senderId === currentUser.id ? 'text-right' : 'text-left'}`}> 
        <span className="inline-block px-3 py-2 rounded-lg bg-gray-100">{msg.text}</span>
        <div className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</div>
      </div>
    ))}
  </div>
);
const MessageInput = ({ onSend }) => {
  const [text, setText] = useState('');
  return (
    <form className="flex p-2 border-t" onSubmit={e => { e.preventDefault(); onSend(text); setText(''); }}>
      <input className="flex-1 border rounded p-2" value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." />
      <button className="ml-2 px-4 py-2 bg-blue-600 text-white rounded" type="submit">Send</button>
    </form>
  );
};
const ChatHeader = ({ book, otherUser }) => (
  <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
    <div>
      <div className="font-semibold">{book?.title || 'Book'}</div>
      <div className="text-xs text-gray-500">with {otherUser?.username || 'User'}</div>
    </div>
  </div>
);

// Comment out the real context import for fallback
// import { useMessage } from '../contexts/useMessage';

const Messages = () => {
  // Fallback: use hardcoded user and data
  const user = { id: 1, username: 'bob456' };
  const [selectedChat, setSelectedChat] = useState(HARDCODED_CONVERSATIONS[0]);
  const [activeChatDetails, setActiveChatDetails] = useState({
    book: { id: 101, title: 'Intro to Algorithms', author: 'CLRS', cover: null },
    otherUser: { id: 2, username: 'alice123', avatar: null }
  });
  const [messages, setMessages] = useState(HARDCODED_MESSAGES);
  const conversations = HARDCODED_CONVERSATIONS;
  const loading = { conversations: false, messages: false };
  const error = null;
  const navigate = useNavigate();

  // Handle selecting a conversation
  const handleSelectConversation = (conversation) => {
    setSelectedChat(conversation);
    setMessages(HARDCODED_MESSAGES.filter(m => m.chatId === conversation.chatId));
    setActiveChatDetails({
      book: { id: 101, title: 'Intro to Algorithms', author: 'CLRS', cover: null },
      otherUser: { id: 2, username: 'alice123', avatar: null }
    });
  };

  // Handle sending a message (just append locally)
  const handleSendMessage = (text) => {
    if (!selectedChat || !text.trim()) return;
    setMessages(prev => [
      ...prev,
      {
        id: prev.length + 1,
        chatId: selectedChat.chatId,
        senderId: user.id,
        receiverId: activeChatDetails.otherUser.id,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        isRead: false
      }
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Link to="/books" className="text-blue-600 hover:text-blue-800">
          Browse Books
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-3 border-b border-gray-200">
              <h2 className="font-medium">Conversations</h2>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
              {conversations.map(conversation => (
                <ConversationItem
                  key={conversation.id || conversation.chatId}
                  conversation={conversation}
                  active={selectedChat && selectedChat.chatId === conversation.chatId}
                  onClick={handleSelectConversation}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Messages Panel */}
        <div className="md:col-span-2">
          {selectedChat ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-[calc(100vh-250px)]">
              <ChatHeader 
                book={activeChatDetails.book} 
                otherUser={activeChatDetails.otherUser}
              />
              <MessageList 
                messages={messages} 
                currentUser={user}
              />
              <MessageInput onSend={handleSendMessage} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center h-[calc(100vh-250px)] flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500">Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;