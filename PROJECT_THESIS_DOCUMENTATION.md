# ITMBU Canteen Management System - Project Documentation & Analysis

## 1. Project Overview
The ITMBU Canteen Management System is a hybrid, real-time ordering platform designed to bridge the gap between digital convenience and physical canteen operations. It supports two primary environments:
- **Online Ordering**: For Students and Faculty to place orders remotely via a Cloud-hosted platform.
- **Offline/On-site Operations**: For Canteen staff (POS & KDS) to manage walkthrough customers and process online orders in real-time, even during partial network outages.

### Key Objectives
- Reduce wait times for students through pre-ordering.
- Streamline kitchen operations using a Kitchen Display System (KDS).
- Ensure data consistency between cloud and local servers.
- Provide administrative insights through real-time analytics.

---

## 2. System Architecture
The project follows a **Hybrid Distributed Architecture**, consisting of three main modules interacting through WebSockets and REST APIs.

### A. Online Module (Cloud-Ready)
- **Frontend**: A responsive React application for students to browse menus, manage carts, and track orders.
- **Backend (Cloud Server)**: A Fastify-based server that acts as a central hub. It handles user authentication, manages cloud-side orders, and serves as a **WebSocket Gateway** between students and the physical canteen.

### B. Offline Module (Local Canteen)
- **Frontend**: Specialized interfaces for **POS (Point of Sale)** and **KDS (Kitchen Display System)**.
- **Backend (Local Server)**: Operates within the canteen. It maintains a local MongoDB for high availability. It features a **Cloud Bridge** that maintains a persistent connection to the Cloud Gateway.

### C. Shared Layer
- **Schemas & Types**: Standardized data structures used by both online and offline modules to ensure seamless synchronization and type safety.

---

## 3. Technology Stack
| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, TypeScript, Tailwind CSS, Lucide Icons, Shadcn UI |
| **State Management** | Zustand (with persistence) |
| **Backend** | Node.js, Fastify (High-performance framework) |
| **Database** | MongoDB (Cloud: Atlas, Local: Community Edition), Mongoose |
| **Communication** | WebSockets (`ws`, `@fastify/websocket`) for real-time updates |
| **Authentication** | JWT (JSON Web Tokens), Cookies, Bcrypt |

---

## 4. Repository Structure

```text
ITMBU_CANTEEN_Modify/
├── app/
│   ├── online-ordering/        # Cloud-facing application
│   │   ├── backend/            # Fastify + Cloud MongoDB
│   │   │   ├── src/
│   │   │   │   ├── modules/    # Admin, User, WebSocket logic
│   │   │   │   ├── database/   # Mongoose models for Cloud
│   │   │   │   └── decorator/  # Auth decorators
│   │   └── frontend/           # React Student/Admin UI
│   ├── offline-ordering/       # On-site canteen application
│   │   ├── backend/            # Fastify + Local MongoDB + Cloud Bridge
│   │   │   ├── src/
│   │   │   │   ├── modules/    # POS, KDS, Sync services
│   │   │   │   └── database/   # Local data persistence
│   │   └── frontend/           # POS & KDS Dashboards
│   └── shared/                 # Unified definitions
│       ├── schemas/            # MongoDB/Mongoose schemas
│       └── types/              # Type definitions (Order, Item, User)
├── run-all.bat                 # Automation script for developers
└── package.json
```

---

## 5. Core Workflows & Logic

### A. Real-Time Ordering Flow (Cloud to Canteen)
1. **Order Placement**: A student places an order on the **Online Frontend**.
2. **Cloud Receipt**: The **Online Backend** receives the order and pushes it to the **Local Bridge** via WebSocket.
3. **Local Processing**: The **Offline Backend** saves the order to the local database and broadcasts it to the **KDS (Kitchen Display System)**.
4. **Kitchen Update**: The Chef updates an item or order status on the KDS.
5. **Relay**: The update travels: *KDS -> Local Server -> Cloud Gateway -> Student App*.

### B. Data Synchronization (Sync Service)
The system implements an **Asynchronous Background Sync**:
- Every 30 seconds, the **OrderSync** service on the Local Server checks for orders marked `isSyncedToCloudDB: false`.
- It performs a bulk upsert to the Cloud MongoDB cluster.
- This ensures that even if individual WebSocket updates fail, the final records are always consistent in the Cloud for Analytics and User History.

### C. Canteen Operation Modes
The system features a state machine for canteen availability:
- **ONLINE**: Accepting all orders.
- **DRAINING**: Triggered when the staff wants to close. It rejects new student orders but allows the kitchen to finish existing ones. Once the queue is empty, it automatically switches to OFFLINE.
- **OFFLINE**: No online orders accepted; cloud bridge is disconnected.

---

## 6. Database Design (Key Models)

### Order Model
- `token`: Human-readable identifier (e.g., SE22-12).
- `enrollmentId`: Link to the student.
- `items`: Array of sub-documents (Item name, price, quantity, individual status).
- `totalAmount`: Calculated sum.
- `status`: [IN QUEUE, READY, DELIVERED, CANCELLED].
- `source`: [LOCAL, CLOUD].

### Menu Template Model
Allows admins to pre-schedule menus based on:
- `dayOfWeek`: (Monday, Tuesday, etc.)
- `mealType`: (Breakfast, Lunch, Snacks, Dinner)
- `items`: References to the global item inventory with optional `specialPrice`.

---

## 7. Advanced Features for Thesis Implementation
1. **WebSocket Fault Tolerance**: Uses `ReconnectingWebSocket` on the bridge to handle flickering internet.
2. **Modular Micro-services**: Decoupled admin and user modules for scalability.
3. **Analytics Dashboard**: Real-time aggregation of revenue, item popularity, and order efficiency.
4. **Multi-Role RBAC**: Distinct logic for Students, Faculty, POS Staff, KDS Staff, and Admins.

---

## 8. Development & Installation
To run the full ecosystem:
1. Ensure **MongoDB** (Local) and a **Cloud URI** are available.
2. Configure `.env` files in both backend folders.
3. Use the root `run-all.bat` to launch all four servers (2 Frontends, 2 Backends).
4. Default ports:
   - Online: BE: 5000, FE: 5174 (Vite default)
   - Offline: BE: 4000, FE: 5173
