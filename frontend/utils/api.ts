// This is a placeholder for the actual API implementation
// In a real application, you would use a library like axios or fetch

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";

export async function login(email: string, password: string) {
  try {
    // Simulate API call
    return {
      success: true,
      data: {
        user: {
          id: "1",
          name: "John Doe",
          email,
        },
        token: "fake-jwt-token",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Invalid credentials",
    };
  }
}

export async function signup(name: string, email: string, password: string) {
  try {
    // Simulate API call
    return {
      success: true,
      data: {
        message: "Verification code sent to your email",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to create account",
    };
  }
}

export async function verifyOTP(email: string, otp: string) {
  try {
    // Simulate API call
    return {
      success: true,
      data: {
        user: {
          id: "1",
          name: "John Doe",
          email,
        },
        token: "fake-jwt-token",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Invalid verification code",
    };
  }
}

export async function getChats() {
  try {
    // Simulate API call
    return {
      success: true,
      data: [
        {
          id: "1",
          name: "John Doe",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
          lastMessage: "Hello there! How are you doing today?",
          timestamp: new Date(),
          unread: 2,
        },
        // More chats...
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch chats",
    };
  }
}

export async function getMessages(chatId: string) {
  try {
    // Simulate API call
    return {
      success: true,
      data: [
        {
          id: "1",
          content: "Hello there! How are you doing today?",
          senderId: "2",
          receiverId: "1",
          timestamp: new Date(),
          read: true,
        },
        // More messages...
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch messages",
    };
  }
}

export async function sendMessage(chatId: string, content: string) {
  try {
    // Simulate API call
    return {
      success: true,
      data: {
        id: "3",
        content,
        senderId: "1",
        receiverId: "2",
        timestamp: new Date(),
        read: false,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to send message",
    };
  }
}