# Data Design — Data Exchange Subsection

*This subsection describes how data is transferred between the client and server in the AI-Enhanced Language Exchange Matchmaker. It is intended for inclusion in the larger Detailed Design Document.*

---

## Data Exchange

The React frontend and Node.js backend communicate primarily through Axios and Socket.io. Axios handles asynchronous HTTP requests for operations such as logging in, registering, updating profiles, fetching friends lists, managing meetings and availability, and retrieving or uploading recordings and transcripts. Data sent and received is formatted in JSON. Socket.io provides a persistent, real-time connection between users and the server for instant messaging; the frontend connects to a dedicated Socket.io server and emits events for sending and receiving chat messages. Each Axios request carries the necessary payload and the frontend may include credentials where the backend expects them. The backend is responsible for managing persistent data. It executes SQL via a MySQL connection pool to insert, retrieve, update, or delete records. The MCP (Model Context Protocol) server is used to facilitate communication between the backend and AI models. The model processes prompts and returns feedback or conversation responses that are integrated into the AI assistant and chat features. Audio for the AI assistant and for recordings is sent from the frontend as multipart form-data (e.g., WebM) and is processed or stored by the backend.

### Format and Protocols

All data exchanged between the frontend, backend, and database follows a JSON structure. HTTP is used for web communication between client and server over the REST API under `/api/v1/` and legacy routes such as `/api/login` and `/Register`. HTTPS is used in production so that communication is encrypted in transit. Socket.io is used for real-time chat messaging. MCP is used for model inference and responses in the AI-driven features. File uploads for recordings and AI assistant audio use multipart/form-data with supported audio or video types and a size limit enforced by the server.

### Security Considerations

Since the application is built around user communication and profiles, security and privacy are important. Personally Identifiable Information (PII), such as names, emails, and profile details, is stored in the MySQL database. The most sensitive data is user passwords. Every user password is hashed before storage using Bcrypt, a JavaScript library that specializes in password hashing and verification; plain-text passwords are never stored. The application is deployed on the Georgia Institute of Technology Web Hosting Services at https://languagematchmaker.modlangs.gatech.edu. In production, traffic between the frontend and backend uses HTTPS to protect data in transit. User authentication is required to access matchmaking, chat, profile, and AI assistant features; the backend validates the user context before fulfilling sensitive requests. The MCP integration relies on the backend to authorize and route requests so that only authenticated users can trigger AI sessions. CORS is configured so that only the intended frontend origin can call the API, which helps limit exposure of user information.

---

*End of Data Exchange subsection.*
