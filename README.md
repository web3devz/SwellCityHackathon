# 🏜️ Dune Wars

**Dune Wars** is an on-chain, AI-powered strategy game that merges human intent with autonomous AI execution. Players define high-level strategic traits, and AI agents independently act to form alliances, negotiate, and compete to dominate territory and earn rewards.

This is a Play-to-Earn game deployed on **Swell Testnet** using **ERC-20 tokens**, and powered by **ChatGPT**, **Cursor AI**, and **Curvegrid's MultiBaas** for blockchain interactions.


## 🚀 Features

- 🤖 AI agents form autonomous alliances and execute strategic logic
- 🎮 Players define traits, agents make tactical decisions
- 💰 Play-to-Earn system using Dune tokens
- 🔗 On-chain interactions using MultiBaas and ERC-20 tokens
- 🔐 Human verification via Self (16+)
- 🌐 Fully decentralized game powered by Swell Testnet


## 🛠️ Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/web3devz/SwellCityHackathon.git
cd SwellCityHackathon
```

---

## ⚙️ Backend Setup (WebSocket Server)

This powers the AI agent interactions via WebSocket.

### 📁 Create `.env` file

In the root directory of the backend:

```bash
touch .env
```

Add the following environment variables:

```
OPENAI_API_KEY=<your_openai_key>
MULTIBAAS_BASE_URL=<your_multibaas_base_url>
MULTIBAAS_API_KEY=<your_multibaas_api_key>
```

### 🧪 Compile and Start

```bash
npx tsc
node dist/index.js
```

This will start the WebSocket server on **`http://localhost:4000`**.


## 💻 Frontend Setup

This includes the player UI, token interaction logic, and integration with **Self** for age verification.

### 1. Start Ngrok (required for Self verification)

```bash
npm run ngrok
```

> After starting ngrok, copy the forwarded URL (e.g., `https://abc123.ngrok.io`).

### 2. Update Ngrok URL in Code

- Replace the ngrok URL in:
  - `verify.ts`
  - `useSelfApp` hook

### 3. Create `.env` for Frontend

```bash
touch .env
```

Add the following values:

```env
NEXT_PUBLIC_PIMLICO_API_KEY=<your_pimlico_key>

# Celo (if applicable)
NEXT_PUBLIC_MULTIBAAS_BASE_URL_CELO=<your_celo_multibaas_url>
NEXT_PUBLIC_MULTIBAAS_API_KEY_CELO=<your_celo_multibaas_key>
NEXT_PUBLIC_MULTIBAAS_CLOUD_WALLET_ADDRESS_CELO=<your_celo_wallet_address>

# Sepolia / Swell
NEXT_PUBLIC_MULTIBAAS_BASE_URL=<your_multibaas_url>
NEXT_PUBLIC_MULTIBAAS_API_KEY=<your_multibaas_key>
NEXT_PUBLIC_MULTIBAAS_CLOUD_WALLET_ADDRESS=<your_wallet_address>
```

> 🔒 Make sure to **never commit your API keys**.

### 4. Start the Frontend App

```bash
npm run dev
```

Your app will be live at **http://localhost:3000**


## 🔐 ERC-7710 Delegation (Metamask Delegation Toolkit)

This project uses a private fork of Metamask's **ERC-7710 Delegation Toolkit** to support token delegation.

- Please follow their [official setup guide](https://github.com/MetaMask/permissionless-delegation) to request access and set up API keys as needed.
- Integration can be found in the smart contract interaction modules.


## 📹 Demo & Links

- **Demo Video**: [Watch on YouTube](https://youtu.be/FTDaQhiZNaI)


## 🧠 Built With

- 🤖 Cursor AI + ChatGPT
- 🔗 Curvegrid MultiBaas
- 🌐 Swell Testnet
- 🛡️ Self (Human Verification)
- 🦊 Metamask Delegation Toolkit (ERC-7710)
- ⚡ TypeScript, Next.js, Node.js, WebSocket, and Ngrok


## 📄 License

MIT


## 🙌 Contributions

Feel free to fork, submit PRs, or suggest improvements!
