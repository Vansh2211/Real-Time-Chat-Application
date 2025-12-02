import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { IUser } from "/workspaces/Real-Time-Chat-Application/backend/src/models/User.ts"
import { Socket } from "socket.io-client";
import manualAxios from "../config/axiosConfig";

type ChatBoxProps = {
  selectedUser: IUser;
  loggedInUser: IUser | null;
  socket: typeof Socket;
};

type Message = {
  id: number;
  senderId: string;
  receiverId: any;
  message: string;
  base64String: string; // Base64 data
  mediaType: string;
  timestamp: string;
};

const socket = io("http://localhost:3000", { transports: ["websocket"] });

const ChatBox: React.FC<ChatBoxProps> = ({ selectedUser, loggedInUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  //  const [users, setUsers] = useState<IUser | null>(null);

  const handleSendMessage = async () => {
    const response = await fetch("http://localhost:3000/action/messages", {
      method: "GET",
      credentials: "include",
    });

    const data = response.json();

    // console.log("Message", data);

    if (currentMessage.trim() && selectedUser.name) {
      const message: Message = {
        senderId: (loggedInUser?._id as string) || "Unknown",
        receiverId: selectedUser._id,
        message: currentMessage,
        base64String: "",
        mediaType: "",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),

        id: Date.now(),
      };

      socket.emit("send_message", message);

      // Clear input fields
      setCurrentMessage("");

      setIsTyping(false);
    }
  };

  const handleMediaUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      const message: Message = {
        senderId: (loggedInUser?._id as string) || "Unknown",
        receiverId: selectedUser._id,
        message: currentMessage || "media",
        base64String: base64String,
        mediaType: file.type,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),

        id: Date.now(),
      };

      console.log("000000", message);
      // Send message to server and socket
      socket.emit("send_message", message);
      // setMessages((prevMessages) => [...prevMessages, message]);

      setCurrentMessage("");

      setIsTyping(false);
      // // Save in database
      // try {
      //   await manualAxios.post("/action/media", message);
      // } catch (error) {
      //   console.error("Error saving media:", error);
      // }
    };
  };

  const base64ToBlob = (base64: string, contentType: string) => {
    const byteCharacters = atob(base64.split(",")[1]);
    const byteNumbers = new Array(byteCharacters.length)
      .fill(0)
      .map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const file = new Blob([byteArray], { type: contentType });

    console.log("file name", file);

    return file;
  };

  const clearChat = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear the chat?"
    );

    if (!confirmClear) return;
    console.log("clear");

    try {
      await manualAxios.post("/action/clearMessages", {
        senderId: loggedInUser?._id,
        receiverId: selectedUser._id,
      });
      setMessages([]);
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);
    setIsTyping(e.target.value.trim() !== "");
  };

  useEffect(() => {
    const getMessage = async () => {
      const response = await manualAxios.post("/action/messages", {
        senderId: loggedInUser?._id,
        receiverId: selectedUser._id,
      });

      setMessages(response.data.messages);
      // console.log(response.data);
    };

    getMessage();
  }, [selectedUser, loggedInUser]);

  useEffect(() => {
    socket.on("receive_message", (msg: Message) => {
      if (
        (msg.senderId === loggedInUser?._id &&
          msg.receiverId === selectedUser._id) ||
        (msg.senderId === selectedUser._id &&
          msg.receiverId === loggedInUser?._id)
      ) {
        setMessages((prevMessages) => [...prevMessages, msg]);
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [selectedUser._id, loggedInUser?._id]);

  useEffect(() => {
    console.log("messages Check: ", messages);
  }, [messages]);

  return (
    <div className="chat-box">
      <nav className="chat-header">
        <div className="chat-user">
          {/* <img src={selectedUser.profilePic || "default-avatar.png"} alt="User" className="chat-avatar" /> */}
          <span className="chat-username"> Chat with {selectedUser.name}</span>
        </div>
      </nav>
      <div className="messages-box">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.senderId === loggedInUser?._id
                ? "my-message"
                : "other-message"
            }`}
          >
            <strong>
              {msg.senderId === loggedInUser?._id
                ? loggedInUser.name
                : selectedUser.name}
              :
            </strong>{" "}
            {msg.base64String ? (
              msg.mediaType?.includes("image") ? (
                <img
                  src={msg.base64String}
                  alt="Media"
                  className="media-image"
                />
              ) : msg.mediaType?.includes("pdf") ? (
                <a
                  href={URL.createObjectURL(
                    base64ToBlob(msg.base64String, "application/pdf")
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open {msg.base64String.split(";")[0].split("/")[1]} 📄
                </a>
              ) : (
                <p>Unsupported file type</p>
              )
            ) : (
              msg.message
            )}
            <span className="timestamp">{msg.timestamp}</span>
          </div>
        ))}
      </div>

      {/* {isTyping && <p className="typing-indicator">You are typing...</p>} */}

      <div className="input-buttons">
        <input
          type="text"
          value={currentMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="message-input"
        />

        <button
          onClick={() => {
            handleSendMessage();
          }}
          className="send-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e8eaed"
          >
            <path d="M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z" />
          </svg>
        </button>

        <div className="media-upload">
          <input
            type="file"
            accept="image/*, application/pdf"
            onChange={handleMediaUpload}
            className="media-input"
            id="mediaInput"
            hidden
          />
          <button
            className="media-button"
            onClick={() => document.getElementById("mediaInput")?.click()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="#e8eaed"
            >
              <path d="M696-312q0 89.86-63.07 152.93Q569.86-96 480-96q-91 0-153.5-65.5T264-319v-389q0-65 45.5-110.5T420-864q66 0 111 48t45 115v365q0 40.15-27.93 68.07Q520.15-240 480-240q-41 0-68.5-29.09T384-340v-380h72v384q0 10.4 6.8 17.2 6.8 6.8 17.2 6.8 10.4 0 17.2-6.8 6.8-6.8 6.8-17.2v-372q0-35-24.5-59.5T419.8-792q-35.19 0-59.5 25.5Q336-741 336-706v394q0 60 42 101.5T480-168q60 1 102-43t42-106v-403h72v408Z" />
            </svg>
          </button>
        </div>

        <button onClick={clearChat} className="clear-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e8eaed"
          >
            <path d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
