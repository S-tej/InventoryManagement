# Green-Tech Inventory Assistant – Design Documentation

## Overview

The Green-Tech Inventory Assistant is an intelligent inventory management system designed to help small organizations (cafes, labs, nonprofits) reduce waste and optimize procurement decisions.

The system combines:
- Batch-level inventory tracking
- AI-powered query system
- Rule-based fallback engine
- Predictive analytics for usage and expiry

---

## Core Design Philosophy

Instead of treating inventory as a single aggregated value, this system uses:

**Batch-Level Modeling**

Each stock addition is treated as a separate batch with:
- Quantity
- Expiry date

This enables:
- Accurate expiry tracking
- FIFO-based consumption
- Real-world waste reduction

---

## Architecture

### 🔹 Backend
- Node.js
- Express.js
- MongoDB (Mongoose)

### 🔹 Frontend
- React.js
- Tailwind CSS

### 🔹 AI Layer
- Google Gemini API

### 🔹 Fallback Layer
- Rule-based query engine (custom logic)

---

## System Flow


User Action → API → Database → AI / Fallback → Response → UI



---

# Data Models

### 1. InventoryItem

* `name`
* `quantity` *(derived from batches)*
* `min_threshold`

---

### 2. Batch *(Core Model)*

* `item_id` *(reference to InventoryItem)*
* `quantity`
* `expiry_date`

---

### 3. UsageHistory

* `item_id`
* `type` *(CONSUMPTION / ADDITION)*
* `change`
* `timestamp`

---

### 4. Prediction

* `item_id`
* `predicted_depletion_date`
* `confidence_score`

---

### 5. Alert

* `item_id`
* `type` *(LOW_STOCK, EXPIRY, WASTE_RISK, etc.)*
* `message`

---

#  FIFO Consumption Logic

Stock is consumed using:

 **First In First Out (FIFO)**

* Oldest batch (earliest expiry) is consumed first
* Prevents premature expiry
* Aligns with real-world inventory usage

---

#  Prediction Engine

The system estimates when an item will run out based on historical consumption.

### Key Features:

* Uses only **consumption data**
* Calculates:

  * Average daily usage
  * Expected depletion date
  * Confidence score

###  Important Enhancement:

* Prediction is **FIFO-aware**
* Consumption follows batch order
* Avoids misleading results from total quantity

---

# Alert System

A cron job runs periodically to generate alerts.

### Alert Types:

* **LOW_STOCK** → Item running out soon
* **EXPIRY** → Batch expiring soon
* **EXPIRED** → Already expired
* **WASTE_RISK** → Will expire before usage
* **OVERSTOCK** → Excess inventory

### Key Design:

 Alerts are generated at **batch-level**, not item-level

---

# AI Integration

The system supports natural language queries such as:

* “What will run out in 3 days?”
* “Which items are expiring soon?”

### AI Capabilities:

* Intent detection
* Response generation
* Smart recommendations

---

#  Fallback System

If AI is unavailable (API error, rate limit, etc.), the system switches to:

 **Rule-Based Fallback Engine**

### Capabilities:

* Keyword-based intent detection
* Uses real-time database data

### Supports:

* Expiry queries
* Low stock detection
* Waste analysis
* Depletion prediction



---

#  Search & Filtering

* Users can search items by name
* Enables quick and efficient navigation of inventory

---

#  Data Safety

* Uses only **synthetic data**
* No scraping of live data
* Sample dataset included in repository

---

# Security

* API keys stored securely in `.env`
* `.env.example` provided
* No sensitive data committed to repository

---

# Testing

Basic tests implemented:

*  Happy path → create item
* Edge case → invalid input

---

# Tradeoffs & Prioritization

### What was simplified:

* Basic NLP fallback (keyword-based)
* Single-user system

### What was prioritized:

* Core functionality
* Batch-level accuracy
* AI + fallback reliability

---

# RESULT

This system combines:

* Batch-level inventory tracking
* FIFO consumption
* AI-powered insights
* Reliable fallback system

