/**
 * ============================================
 * AVANTI HELP DESK WIDGET v7.0 - KOMMUNICATE EXACT
 * ============================================
 * 
 * Exact replica of Kommunicate.io design
 * Standalone widget - Include with:
 * <script src="avanti-widget.js"></script>
 * 
 * Make sure Firebase is loaded before this script.
 */

(function() {
    'use strict';

    // ============================================
    // INJECT GOOGLE FONTS
    // ============================================
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // ============================================
    // INJECT CSS STYLES - KOMMUNICATE EXACT
    // ============================================
    const styleEl = document.createElement('style');
    styleEl.id = 'avanti-widget-styles';
    styleEl.textContent = `
    /* BLINKING YELLOW RING */
.avanti-fab::before {
    content: "";
    position: absolute;
    inset: -5px;                 /* smaller ring */
    border-radius: 50%;
    border: 2px solid #FFD400;   /* thinner ring */
    animation: avantiBlink 3s infinite; /* slower animation */
    pointer-events: none;
}

@keyframes avantiBlink {
    0% { transform: scale(0.8); opacity: 0.3; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(1.4); opacity: 0; }
}

/* ============================================
   AVANTI WIDGET v7.0 - KOMMUNICATE EXACT
   ============================================ */

:root {
    --km-primary: #5D5FEF;
    --km-primary-dark: #4F46E5;
    --km-primary-light: #EEF2FF;
    --km-header-bg: linear-gradient(135deg, #5D5FEF 0%, #7C3AED 100%);
    --km-accent: #5D5FEF;
    --km-bg: #FFFFFF;
    --km-bg-gray: #F7F8FA;
    --km-text: #1F2937;
    --km-text-secondary: #6B7280;
    --km-text-muted: #9CA3AF;
    --km-border: #E5E7EB;
    --km-success: #10B981;
    --km-error: #EF4444;
    --km-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    --km-radius: 16px;
    --km-radius-lg: 24px;
}

/* Reset */
.avanti-widget-container * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ============================================
   FLOATING ACTION BUTTON
   ============================================ */
.avanti-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #F4B41A 0%, #FF9800 100%);
    border: none;
    cursor: pointer;
    box-shadow: 0 8px 32px rgba(244, 180, 26, 0.4);
    z-index: 99990;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.avanti-fab:hover {
    transform: scale(1.08);
    box-shadow: 0 12px 40px rgba(244, 180, 26, 0.5);
}

.avanti-fab svg {
    width: 28px;
    height: 28px;
    fill: #1A1D26;
    transition: all 0.3s ease;
}

.avanti-fab.open svg.icon-chat { display: none; }
.avanti-fab.open svg.icon-close { display: block; }
.avanti-fab svg.icon-close { display: none; }

/* Notification Badge */
.avanti-fab-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 22px;
    height: 22px;
    background: var(--km-error);
    border-radius: 50%;
    border: 3px solid #fff;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
}

.avanti-fab-badge.show { display: flex; }

/* ============================================
   GREETING BUBBLE
   ============================================ */
.avanti-greeting {
    position: fixed;
    bottom: 100px;
    right: 24px;
    background: var(--km-bg);
    border-radius: var(--km-radius);
    padding: 16px 20px;
    max-width: 280px;
    box-shadow: var(--km-shadow);
    z-index: 99985;
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px) scale(0.95);
    transition: all 0.3s ease;
    border: 1px solid var(--km-border);
}

.avanti-greeting::after {
    content: '';
    position: absolute;
    bottom: -8px;
    right: 28px;
    width: 16px;
    height: 16px;
    background: var(--km-bg);
    transform: rotate(45deg);
    border-right: 1px solid var(--km-border);
    border-bottom: 1px solid var(--km-border);
}

.avanti-greeting.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
}

.avanti-greeting-close {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border: none;
    background: var(--km-bg-gray);
    border-radius: 50%;
    cursor: pointer;
    color: var(--km-text-muted);
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avanti-greeting-text {
    font-size: 14px;
    line-height: 1.5;
    color: var(--km-text);
    padding-right: 20px;
}

/* ============================================
   MAIN PANEL - KOMMUNICATE STYLE
   ============================================ */
.avanti-panel {
    position: fixed;
    bottom: 100px;
    right: 24px;
    width: 380px;
    height: 600px;
    max-height: calc(100vh - 120px);
    background: var(--km-bg);
    border-radius: var(--km-radius-lg);
    box-shadow: var(--km-shadow);
    z-index: 99995;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px) scale(0.95);
    transition: all 0.3s ease;
}

.avanti-panel.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
}

/* Mobile */
@media (max-width: 480px) {
    .avanti-fab {
        bottom: 80px;
        right: 16px;
        width: 56px;
        height: 56px;
    }
    
    .avanti-greeting {
        bottom: 150px;
        right: 16px;
        left: 16px;
        max-width: none;
    }
    
    .avanti-panel {
        bottom: 0;
        right: 0;
        left: 0;
        width: 100%;
        height: 100%;
        max-height: 100vh;
        border-radius: 0;
    }
}

/* ============================================
   HEADER - KOMMUNICATE PURPLE
   ============================================ */
.avanti-header {
    background: var(--km-header-bg);
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
}

.avanti-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.avanti-header-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.avanti-header-avatar img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
}

.avanti-header-avatar .online-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    background: var(--km-success);
    border-radius: 50%;
    border: 2px solid #5D5FEF;
}

.avanti-header-info h1 {
    font-size: 16px;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 2px;
}

.avanti-header-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
}

.avanti-header-status::before {
    content: '';
    width: 8px;
    height: 8px;
    background: #4ADE80;
    border-radius: 50%;
}

.avanti-header-close {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    cursor: pointer;
    color: #FFFFFF;
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.avanti-header-close:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* ============================================
   BODY
   ============================================ */
.avanti-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--km-bg-gray);
}

/* ============================================
   VIEWS
   ============================================ */
.avanti-view {
    display: none;
    flex-direction: column;
    height: 100%;
}

.avanti-view.active {
    display: flex;
}

/* ============================================
   WELCOME VIEW - KOMMUNICATE EXACT
   ============================================ */
.avanti-welcome-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: var(--km-bg-gray);
}

/* Hero Card - Purple */
.avanti-hero-card {
    background: var(--km-header-bg);
    border-radius: 20px;
    padding: 32px 24px;
    margin-bottom: 20px;
    text-align: left;
    box-shadow: 0 4px 20px rgba(93, 95, 239, 0.3);
}

.avanti-hero-emoji {
    font-size: 48px;
    margin-bottom: 16px;
    display: block;
}

.avanti-hero-label {
    font-size: 13px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 8px;
}

.avanti-hero-title {
    font-size: 26px;
    font-weight: 700;
    color: #FFFFFF;
    line-height: 1.3;
    margin-bottom: 24px;
}

/* Search Box */
.avanti-search-box {
    display: flex;
    align-items: center;
    background: #FFFFFF;
    border-radius: 50px;
    padding: 14px 20px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.avanti-search-box:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.avanti-search-box svg {
    width: 20px;
    height: 20px;
    fill: var(--km-text-muted);
    margin-right: 12px;
    flex-shrink: 0;
}

.avanti-search-box span {
    color: var(--km-text-muted);
    font-size: 14px;
}

/* Help Text */
.avanti-help-text {
    text-align: center;
    padding: 16px 0;
    color: var(--km-text-secondary);
    font-size: 14px;
}

/* Quick Actions Section */
.avanti-section-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--km-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
    padding-left: 4px;
}

.avanti-quick-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.avanti-quick-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: #FFFFFF;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.avanti-quick-item:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.avanti-quick-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
}

.avanti-quick-icon.login { background: linear-gradient(135deg, #FEE2E2, #FECACA); }
.avanti-quick-icon.attendance { background: linear-gradient(135deg, #DBEAFE, #BFDBFE); }
.avanti-quick-icon.curriculum { background: linear-gradient(135deg, #D1FAE5, #A7F3D0); }
.avanti-quick-icon.ticket { background: linear-gradient(135deg, #FEF3C7, #FDE68A); }

.avanti-quick-content {
    flex: 1;
}

.avanti-quick-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--km-text);
    margin-bottom: 2px;
}

.avanti-quick-desc {
    font-size: 13px;
    color: var(--km-text-muted);
}

.avanti-quick-arrow {
    color: var(--km-text-muted);
    font-size: 20px;
    font-weight: 300;
}

/* ============================================
   CHAT VIEW
   ============================================ */
.avanti-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--km-bg-gray);
}

.avanti-message {
    max-width: 85%;
    animation: msgSlide 0.3s ease;
}

@keyframes msgSlide {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.avanti-message.bot { align-self: flex-start; }
.avanti-message.user { align-self: flex-end; }

.avanti-message-bubble {
    padding: 14px 18px;
    border-radius: 20px;
    font-size: 14px;
    line-height: 1.5;
}

.avanti-message.bot .avanti-message-bubble {
    background: #FFFFFF;
    color: var(--km-text);
    border: 1px solid var(--km-border);
    border-bottom-left-radius: 6px;
}

.avanti-message.user .avanti-message-bubble {
    background: var(--km-primary);
    color: #FFFFFF;
    border-bottom-right-radius: 6px;
}

/* Typing */
.avanti-typing {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 16px 18px;
    background: #FFFFFF;
    border: 1px solid var(--km-border);
    border-radius: 20px;
    border-bottom-left-radius: 6px;
    width: fit-content;
}

.avanti-typing-dot {
    width: 8px;
    height: 8px;
    background: var(--km-text-muted);
    border-radius: 50%;
    animation: bounce 1.4s ease-in-out infinite;
}

.avanti-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.avanti-typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
}

/* Chat Input */
.avanti-chat-input-area {
    padding: 12px 16px;
    background: #FFFFFF;
    border-top: 1px solid var(--km-border);
    display: flex;
    align-items: center;
    gap: 12px;
}

.avanti-chat-input {
    flex: 1;
    padding: 14px 20px;
    background: var(--km-bg-gray);
    border: 2px solid transparent;
    border-radius: 50px;
    font-size: 14px;
    color: var(--km-text);
    transition: all 0.2s;
}

.avanti-chat-input:focus {
    outline: none;
    border-color: #F4B41A;
    background: #FFFFFF;
}

.avanti-chat-input::placeholder {
    color: var(--km-text-muted);
}

.avanti-chat-send {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #F4B41A 0%, #FF9800 100%);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
}

.avanti-chat-send:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 16px rgba(244, 180, 26, 0.4);
}

.avanti-chat-send svg {
    width: 22px;
    height: 22px;
    fill: #1A1D26;
}

/* FAQ Card */
.avanti-faq-card {
    background: #FFFFFF;
    border: 1px solid var(--km-border);
    border-radius: 16px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 8px;
}

.avanti-faq-card:hover {
    border-color: var(--km-primary);
    background: var(--km-primary-light);
}

.avanti-faq-card h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--km-text);
    margin-bottom: 4px;
}

.avanti-faq-card .category {
    font-size: 11px;
    color: var(--km-primary);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
}

/* ============================================
   TICKETS VIEW
   ============================================ */
.avanti-tickets-header {
    padding: 20px;
    background: #FFFFFF;
    border-bottom: 1px solid var(--km-border);
}

.avanti-tickets-header h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--km-text);
}

.avanti-tickets-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: var(--km-bg-gray);
}

.avanti-ticket-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px;
    background: #FFFFFF;
    border-radius: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.avanti-ticket-card:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.avanti-ticket-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #DBEAFE, #BFDBFE);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
}

.avanti-ticket-content { flex: 1; min-width: 0; }

.avanti-ticket-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.avanti-ticket-id {
    font-family: 'SF Mono', 'Consolas', monospace;
    font-size: 12px;
    font-weight: 600;
    color: var(--km-text);
}

.avanti-ticket-status {
    padding: 3px 10px;
    border-radius: 50px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
}

.avanti-ticket-status.open { background: #FEE2E2; color: #DC2626; }
.avanti-ticket-status.in-progress { background: #FEF3C7; color: #D97706; }
.avanti-ticket-status.resolved { background: #D1FAE5; color: #059669; }

.avanti-ticket-subject {
    font-size: 14px;
    font-weight: 600;
    color: var(--km-text);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.avanti-ticket-meta {
    font-size: 12px;
    color: var(--km-text-muted);
}

/* Empty State */
.avanti-empty {
    text-align: center;
    padding: 48px 24px;
}

.avanti-empty-icon {
    font-size: 56px;
    margin-bottom: 16px;
}

.avanti-empty p {
    color: var(--km-text-muted);
    font-size: 14px;
    margin-bottom: 20px;
}

/* ============================================
   FORM VIEW
   ============================================ */
.avanti-form-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: var(--km-bg-gray);
}

.avanti-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: #FFFFFF;
    border: 1px solid var(--km-border);
    border-radius: 10px;
    font-size: 14px;
    color: var(--km-text);
    cursor: pointer;
    margin-bottom: 20px;
    transition: all 0.2s;
}

.avanti-back-btn:hover {
    background: var(--km-bg-gray);
}

.avanti-form-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--km-text);
    margin-bottom: 20px;
}

/* User Card */
.avanti-user-card {
    background: linear-gradient(135deg, #D1FAE5, #A7F3D0);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 20px;
}

.avanti-user-card-title {
    font-size: 11px;
    font-weight: 700;
    color: #065F46;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
}

.avanti-user-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(6, 95, 70, 0.1);
    font-size: 13px;
}

.avanti-user-row:last-child { border-bottom: none; }
.avanti-user-row .label { color: #047857; }
.avanti-user-row .value { color: #065F46; font-weight: 600; }

/* Form */
.avanti-form-group { margin-bottom: 18px; }

.avanti-form-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--km-text);
    margin-bottom: 8px;
}

.avanti-form-input,
.avanti-form-select,
.avanti-form-textarea {
    width: 100%;
    padding: 14px 16px;
    background: #FFFFFF;
    border: 1px solid var(--km-border);
    border-radius: 12px;
    font-size: 14px;
    color: var(--km-text);
    transition: all 0.2s;
}

.avanti-form-input:focus,
.avanti-form-select:focus,
.avanti-form-textarea:focus {
    outline: none;
    border-color: var(--km-primary);
    box-shadow: 0 0 0 3px rgba(93, 95, 239, 0.1);
}

.avanti-form-textarea {
    min-height: 100px;
    resize: vertical;
}

/* Screenshot */
.avanti-screenshot-zone {
    border: 2px dashed var(--km-border);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #FFFFFF;
}

.avanti-screenshot-zone:hover {
    border-color: var(--km-primary);
    background: var(--km-primary-light);
}

.avanti-screenshot-zone .icon { font-size: 32px; margin-bottom: 8px; }
.avanti-screenshot-zone p { color: var(--km-text-muted); font-size: 13px; }

.avanti-screenshot-preview {
    position: relative;
    display: none;
    margin-top: 12px;
}

.avanti-screenshot-preview img {
    width: 100%;
    border-radius: 12px;
    border: 1px solid var(--km-border);
}

.avanti-screenshot-remove {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--km-error);
    border: none;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Progress */
.avanti-progress {
    margin-top: 12px;
    padding: 12px;
    background: #FFFFFF;
    border-radius: 8px;
    display: none;
}

.avanti-progress-bar {
    height: 6px;
    background: var(--km-border);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 8px;
}

.avanti-progress-fill {
    height: 100%;
    background: linear-gradient(135deg, #F4B41A, #FF9800);
    width: 0%;
    transition: width 0.3s;
}

.avanti-progress-text {
    font-size: 12px;
    color: var(--km-text-muted);
}

/* Submit Button */
.avanti-submit-btn {
    width: 100%;
    padding: 16px 24px;
    background: linear-gradient(135deg, #F4B41A 0%, #FF9800 100%);
    color: #1A1D26;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 8px;
}

.avanti-submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(244, 180, 26, 0.4);
}

.avanti-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* Buttons */
.avanti-btn-primary {
    width: 100%;
    padding: 14px 24px;
    background: linear-gradient(135deg, #F4B41A 0%, #FF9800 100%);
    color: #1A1D26;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.avanti-btn-secondary {
    width: 100%;
    padding: 14px 24px;
    background: #FFFFFF;
    color: var(--km-text);
    border: 1px solid var(--km-border);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 10px;
}

/* Success */
.avanti-success {
    text-align: center;
    padding: 48px 24px;
}

.avanti-success .icon { font-size: 72px; margin-bottom: 20px; }

.avanti-success h3 {
    font-size: 24px;
    font-weight: 700;
    color: var(--km-text);
    margin-bottom: 12px;
}

.avanti-success .ticket-id {
    display: inline-block;
    padding: 8px 16px;
    background: #FEF3C7;
    color: #92400E;
    font-family: monospace;
    font-size: 14px;
    font-weight: 600;
    border-radius: 8px;
    margin-bottom: 16px;
}

.avanti-success p {
    color: var(--km-text-muted);
    font-size: 14px;
    margin-bottom: 24px;
}

/* ============================================
   BOTTOM NAVIGATION - KOMMUNICATE STYLE
   ============================================ */
.avanti-bottom-nav {
    display: flex;
    background: #FFFFFF;
    border-top: 1px solid var(--km-border);
    padding: 8px 4px;
}

.avanti-nav-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 4px;
    background: transparent;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
}

.avanti-nav-btn:hover {
    background: var(--km-bg-gray);
}

.avanti-nav-btn.active {
    background: var(--km-primary-light);
}

.avanti-nav-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avanti-nav-btn.active .avanti-nav-icon {
    background: var(--km-primary);
}

.avanti-nav-icon svg {
    width: 20px;
    height: 20px;
    fill: var(--km-text-muted);
}

.avanti-nav-btn.active .avanti-nav-icon svg {
    fill: #FFFFFF;
}

.avanti-nav-label {
    font-size: 10px;
    font-weight: 500;
    color: var(--km-text-muted);
}

.avanti-nav-btn.active .avanti-nav-label {
    color: var(--km-primary);
    font-weight: 600;
}

.avanti-nav-badge {
    position: absolute;
    top: 2px;
    right: calc(50% - 16px);
    min-width: 16px;
    height: 16px;
    background: var(--km-error);
    border-radius: 50%;
    font-size: 9px;
    font-weight: 700;
    color: #fff;
    display: none;
    align-items: center;
    justify-content: center;
}

.avanti-nav-badge.show { display: flex; }

/* ============================================
   TOAST
   ============================================ */
.avanti-toast {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    padding: 14px 24px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    z-index: 999999;
    opacity: 0;
    transition: all 0.3s;
    box-shadow: var(--km-shadow);
    background: #FEF3C7;
    color: #92400E;
    border: 1px solid #FDE68A;
    cursor: pointer;
}

.avanti-toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

/* Spinner */
.avanti-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0,0,0,0.2);
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 8px;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Scrollbar */
.avanti-welcome-scroll::-webkit-scrollbar,
.avanti-chat-messages::-webkit-scrollbar,
.avanti-tickets-list::-webkit-scrollbar,
.avanti-form-scroll::-webkit-scrollbar {
    width: 6px;
}

.avanti-welcome-scroll::-webkit-scrollbar-thumb,
.avanti-chat-messages::-webkit-scrollbar-thumb,
.avanti-tickets-list::-webkit-scrollbar-thumb,
.avanti-form-scroll::-webkit-scrollbar-thumb {
    background: var(--km-border);
    border-radius: 3px;
}

/* Logo */
.avanti-logo-img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
}
`;
    document.head.appendChild(styleEl);

    // ============================================
    // INJECT HTML
    // ============================================
    const widgetContainer = document.createElement('div');
    widgetContainer.innerHTML = `
    <div class="avanti-widget-container">
        <!-- Greeting -->
        <div class="avanti-greeting" id="avantiGreeting">
            <button class="avanti-greeting-close" onclick="event.stopPropagation(); AvantiWidget.hideGreeting()">×</button>
            <div class="avanti-greeting-text" id="greetingBubbleText">
                🙏 <strong>Namaste!</strong> Need help with the Curriculum Tracker?
            </div>
        </div>
        
        <!-- FAB -->
        <button class="avanti-fab" id="avantiFab" onclick="AvantiWidget.toggle()">
            <svg class="icon-chat" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            <svg class="icon-close" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            <span class="avanti-fab-badge" id="fabBadge"></span>
        </button>
        
        <!-- Panel -->
        <div class="avanti-panel" id="avantiPanel">
            <!-- Header -->
            <div class="avanti-header">
                <div class="avanti-header-left">
                    <div class="avanti-header-avatar">
                        <img src="./logo.png" class="avanti-logo-img" alt="Avanti" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=font-size:24px>💬</span><span class=online-dot></span>';">
                        <span class="online-dot"></span>
                    </div>
                    <div class="avanti-header-info">
                        <h1>Avanti Help Desk</h1>
                        <div class="avanti-header-status">Online</div>
                    </div>
                </div>
                <button class="avanti-header-close" onclick="AvantiWidget.close()">×</button>
            </div>
            
            <!-- Body -->
            <div class="avanti-body" id="avantiBody">
                <!-- Welcome View -->
                <div class="avanti-view active" id="welcomeView">
                    <div class="avanti-welcome-scroll">
                        <!-- Hero Card -->
                        <div class="avanti-hero-card">
                            <span class="avanti-hero-emoji">👋</span>
                            <div class="avanti-hero-label" id="heroLabel">GOOD MORNING</div>
                            <div class="avanti-hero-title" id="heroTitle">Namaste! How can we help you?</div>
                            
                            <div class="avanti-search-box" onclick="AvantiWidget.showFAQs()">
                                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                                <span>Search in FAQs...</span>
                            </div>
                        </div>
                        
                        <!-- Help Text -->
                        <div class="avanti-help-text">
                            We're here to help you get instant answers.
                        </div>
                        
                        <!-- Quick Help -->
                        <div class="avanti-section-label">QUICK HELP</div>
                        <div class="avanti-quick-list">
                            <button class="avanti-quick-item" onclick="AvantiWidget.searchTopic('login')">
                                <div class="avanti-quick-icon login">🔐</div>
                                <div class="avanti-quick-content">
                                    <div class="avanti-quick-title">Login Issues</div>
                                    <div class="avanti-quick-desc">Password, OTP problems</div>
                                </div>
                                <span class="avanti-quick-arrow">›</span>
                            </button>
                            
                            <button class="avanti-quick-item" onclick="AvantiWidget.searchTopic('attendance')">
                                <div class="avanti-quick-icon attendance">📅</div>
                                <div class="avanti-quick-content">
                                    <div class="avanti-quick-title">Attendance Help</div>
                                    <div class="avanti-quick-desc">Mark, view attendance</div>
                                </div>
                                <span class="avanti-quick-arrow">›</span>
                            </button>
                            
                            <button class="avanti-quick-item" onclick="AvantiWidget.searchTopic('curriculum')">
                                <div class="avanti-quick-icon curriculum">📚</div>
                                <div class="avanti-quick-content">
                                    <div class="avanti-quick-title">Curriculum & Progress</div>
                                    <div class="avanti-quick-desc">Syllabus, chapters</div>
                                </div>
                                <span class="avanti-quick-arrow">›</span>
                            </button>
                            
                            <button class="avanti-quick-item" onclick="AvantiWidget.showForm()">
                                <div class="avanti-quick-icon ticket">🎫</div>
                                <div class="avanti-quick-content">
                                    <div class="avanti-quick-title">Raise a Ticket</div>
                                    <div class="avanti-quick-desc">Get personalized support</div>
                                </div>
                                <span class="avanti-quick-arrow">›</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Chat View -->
                <div class="avanti-view" id="chatView">
                    <div class="avanti-chat-messages" id="chatMessages"></div>
                    <div class="avanti-chat-input-area">
                        <input type="text" class="avanti-chat-input" id="chatInput" placeholder="Type your question..." onkeypress="if(event.key==='Enter' && !event.repeat)AvantiWidget.sendMessage()">
                        <button class="avanti-chat-send" onclick="AvantiWidget.sendMessage()">
                            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                        </button>
                    </div>
                </div>
                
                <!-- Tickets View -->
                <div class="avanti-view" id="ticketsView">
                    <div class="avanti-tickets-header">
                        <h2>Your Tickets</h2>
                    </div>
                    <div class="avanti-tickets-list" id="ticketsList"></div>
                </div>
                <!-- FAQ View -->
<div class="avanti-view" id="faqView">
    <div class="avanti-welcome-scroll" id="faqList"></div>
</div>
                
                <!-- Form View -->
                <div class="avanti-view" id="formView">
                    <div class="avanti-form-scroll" id="formContent"></div>
                </div>
            </div>
            
            <!-- Bottom Nav -->
            <div class="avanti-bottom-nav">
                <button class="avanti-nav-btn active" id="navWelcome" onclick="AvantiWidget.showWelcome()">
                    <div class="avanti-nav-icon">
                        <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"/></svg>
                    </div>
                    <span class="avanti-nav-label">Welcome</span>
                </button>
                <button class="avanti-nav-btn" id="navConversations" onclick="AvantiWidget.showChat()">
                    <div class="avanti-nav-icon">
                        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                    </div>
                    <span class="avanti-nav-label">Conversations</span>
                </button>
                <button class="avanti-nav-btn" id="navFaqs" onclick="AvantiWidget.showFAQs()">
                    <div class="avanti-nav-icon">
                        <svg viewBox="0 0 24 24"><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>
                    </div>
                    <span class="avanti-nav-label">FAQs</span>
                </button>
                <button class="avanti-nav-btn" id="navTickets" onclick="AvantiWidget.showTickets()">
                    <div class="avanti-nav-icon">
                        <svg viewBox="0 0 24 24"><path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46 0-1.48-.8-2.77-1.99-3.46L4 6h16v2.54z"/></svg>
                    </div>
                    <span class="avanti-nav-label">Tickets</span>
                    <span class="avanti-nav-badge" id="ticketsBadge"></span>
                </button>
            </div>
        </div>
    </div>
    `;
    document.body.appendChild(widgetContainer);

    // ============================================
    // WIDGET JAVASCRIPT
    // ============================================
    window.AvantiWidget = {
        isOpen: false,
        user: null,
        faqs: [],
        tickets: [],
        currentView: 'welcome',
        screenshotFile: null,
        screenshotDataUrl: null,
        firebaseReady: false,
        initAttempts: 0,
        unreadNotifications: 0,
        isUploadingScreenshot: false,
        
        // Get time-based greeting
        getGreeting: function() {
            const hour = new Date().getHours();
            if (hour < 12) {
                return { label: 'GOOD MORNING', emoji: '🌅' };
            } else if (hour < 17) {
                return { label: 'GOOD AFTERNOON', emoji: '☀️' };
            } else {
                return { label: 'GOOD EVENING', emoji: '🌙' };
            }
        },
        
        // Initialize
        init: function() {
            console.log('[AvantiWidget] v7.0 Kommunicate Exact - Starting...');
            
            this.getUserFromLocalStorage();
            this.waitForFirebase();
            
            setTimeout(() => this.showGreeting(), 8000);
            setTimeout(() => this.updateNotificationBadge(), 500);
            
            // Update welcome text after a short delay to allow user detection
            setTimeout(() => this.updateWelcomeText(), 100);
            
            this.ensureVisible();
            setInterval(() => this.ensureVisible(), 2000);
            
            // Save original welcome content BEFORE personalization (save structure only)
            const welcomeScroll = document.querySelector('.avanti-welcome-scroll');
            if (welcomeScroll && !this._welcomeHTML) {
                this._welcomeHTML = welcomeScroll.innerHTML;
            }
            
            console.log('[AvantiWidget] Init complete');
        },
        
        // Update welcome text with user name and time-based greeting
        updateWelcomeText: function() {
            const greeting = this.getGreeting();
            const userName = this.user?.name || '';
            
            // Update hero label
            const heroLabel = document.getElementById('heroLabel');
            if (heroLabel) {
                heroLabel.textContent = greeting.label;
            }
            
            // Update hero title with Namaste + username
            const heroTitle = document.getElementById('heroTitle');
            if (heroTitle) {
                if (userName) {
                    heroTitle.textContent = `Namaste ${userName}! How can we help you?`;
                } else {
                    heroTitle.textContent = 'Namaste! How can we help you?';
                }
            }
            
            // Update greeting bubble
            const greetingText = document.getElementById('greetingBubbleText');
            if (greetingText) {
                if (userName) {
                    greetingText.innerHTML = `🙏 <strong>Namaste ${userName}!</strong> Need help with the Curriculum Tracker?`;
                } else {
                    greetingText.innerHTML = `🙏 <strong>Namaste!</strong> Need help with the Curriculum Tracker?`;
                }
            }
        },
        
        ensureVisible: function() {
            const fab = document.getElementById('avantiFab');
            if (fab) {
                fab.style.display = 'flex';
                fab.style.visibility = 'visible';
            }
        },
        
        // Firebase
        waitForFirebase: function() {
            this.initAttempts++;
            
            if (typeof firebase !== 'undefined') {
                try {
                    firebase.firestore();
                    this.firebaseReady = true;
                    console.log('[AvantiWidget] ✓ Firebase ready');
                    
                    this.getTeacherFromFirebase();
                    this.loadFAQs();
                    setTimeout(() => this.loadTickets(), 500);
                    return;
                } catch (e) {
                    console.log('[AvantiWidget] Firebase check attempt:', this.initAttempts);
                }
            }
            
            if (this.initAttempts < 30) {
                setTimeout(() => this.waitForFirebase(), 500);
            } else {
                console.log('[AvantiWidget] Firebase not available');
                // Show empty states properly
                this.renderTicketsList([]);
            }
        },
        
        // User detection
        getUserFromLocalStorage: function() {
            const keys = ['studentSession', 'student', 'studentData', 'currentStudent', 'loggedInStudent'];
            
            for (const key of keys) {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const p = JSON.parse(data);
                        if (p && (p.name || p.studentId || p.id)) {
                            this.user = {
                                type: 'student',
                                name: p.name || p.studentName || '',
                                studentId: String(p.studentId || p.id || ''),
                                school: p.school || p.schoolName || p.center || '',
                                grade: p.grade || p.class || ''
                            };
                            this._userNameCache = this.user.name || '';
                            console.log('[AvantiWidget] ✓ Student:', this.user.name);
                            // Update welcome text with student name
                            setTimeout(() => this.updateWelcomeText(), 50);
                            return;
                        }
                    }
                } catch (e) {}
            }
        },
        
        getTeacherFromFirebase: function() {
            if (!this.firebaseReady || this.user) return;
            
            try {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) this.setTeacherUser(currentUser);
                
                firebase.auth().onAuthStateChanged(u => {
                    if (u && (!this.user || this.user.type !== 'student')) {
                        this.setTeacherUser(u);
                    }
                });
            } catch (e) {}
        },
        
        setTeacherUser: function(u) {
            this.user = {
                type: 'teacher',
                name: u.displayName || u.email?.split('@')[0] || '',
                email: u.email || '',
                school: ''
            };
            this._userNameCache = this.user.name || '';
            
            // Update welcome text with teacher name
            this.updateWelcomeText();
            
            try {
                firebase.firestore().collection('teachers')
                    .where('email', '==', u.email)
                    .limit(1)
                    .get()
                    .then(snap => {
                        if (!snap.empty) {
                            const t = snap.docs[0].data();
                            this.user.name = t.name || this.user.name;
                            this.user.school = t.school || t.center || '';
                            this._userNameCache = this.user.name || '';
                            // Update again with full name from Firestore
                            this.updateWelcomeText();
                        }
                    }).catch(() => {});
            } catch (e) {}
        },
        
        // Greeting
        showGreeting: function() {
            const g = document.getElementById('avantiGreeting');
            const p = document.getElementById('avantiPanel');
            
            if (g && p && !p.classList.contains('open')) {
                g.classList.add('show');
                g.onclick = () => this.open();
                setTimeout(() => g.classList.remove('show'), 10000);
            }
        },
        
        hideGreeting: function() {
            document.getElementById('avantiGreeting')?.classList.remove('show');
        },
        
        // Panel
        toggle: function() {
            this.isOpen ? this.close() : this.open();
        },
        
        open: function() {
            this.isOpen = true;
            document.getElementById('avantiPanel').classList.add('open');
            document.getElementById('avantiFab').classList.add('open');
            this.hideGreeting();
        },
        
        close: function() {
            this.isOpen = false;
            document.getElementById('avantiPanel').classList.remove('open');
            document.getElementById('avantiFab').classList.remove('open');
        },
        
        // Navigation
        setActiveNav: function(id) {
            document.querySelectorAll('.avanti-nav-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(id)?.classList.add('active');
        },
        
        setActiveView: function(id) {
            document.querySelectorAll('.avanti-view').forEach(v => v.classList.remove('active'));
            document.getElementById(id)?.classList.add('active');
            this.currentView = id;
        },
        
        showWelcome: function() {
            this.setActiveView('welcomeView');
            this.setActiveNav('navWelcome');
            
            // Get fresh greeting based on current time
            const greeting = this.getGreeting();
            
            // Get username from user object or cache
            const userName = this.user?.name || this._userNameCache || '';
            
            // Restore original HTML structure if needed
            const container = document.querySelector('.avanti-welcome-scroll');
            if (container && this._welcomeHTML) {
                container.innerHTML = this._welcomeHTML;
            }
            
            // Update the greeting label (GOOD MORNING/AFTERNOON/EVENING)
            const heroLabel = document.getElementById('heroLabel');
            if (heroLabel) {
                heroLabel.textContent = greeting.label;
            }
            
            // Update the main hero title with Namaste + username
            const heroTitle = document.getElementById('heroTitle');
            if (heroTitle) {
                if (userName) {
                    heroTitle.textContent = `Namaste ${userName}! How can we help you?`;
                } else {
                    heroTitle.textContent = 'Namaste! How can we help you?';
                }
            }
            
            // Re-attach FAQ search click
            const searchBox = container?.querySelector('.avanti-search-box');
            if (searchBox) {
                searchBox.onclick = () => this.showFAQs();
            }
        },
        
        showChat: function() {
            this.setActiveView('chatView');
            this.setActiveNav('navConversations');
            
            const m = document.getElementById('chatMessages');
            if (!m.innerHTML.trim()) {
                m.innerHTML = `
                    <div class="avanti-message bot">
                        <div class="avanti-message-bubble">
                            Hello! 👋 How can I help you today?
                        </div>
                    </div>
                `;
            }
            
            setTimeout(() => document.getElementById('chatInput')?.focus(), 100);
        },
        
        showFAQs: function () {
            this.setActiveView('faqView');
            this.setActiveNav('navFaqs');

            const container = document.getElementById('faqList');
            if (!container) return;

            // Show loading if FAQs haven't loaded yet
            if (!this.faqs || this.faqs.length === 0) {
                // Check if we're still waiting for Firebase
                if (!this.firebaseReady) {
                    container.innerHTML = `
                        <div class="avanti-section-label">FAQs</div>
                        <div class="avanti-empty">
                            <div class="avanti-empty-icon">⏳</div>
                            <p>Loading FAQs...</p>
                        </div>
                    `;
                    // Retry loading FAQs
                    setTimeout(() => {
                        if (this.firebaseReady && this.currentView === 'faqView') {
                            this.loadFAQs();
                        }
                    }, 1000);
                    return;
                }
                
                // Show error if there was one
                const errorMsg = this._faqError ? `<p style="font-size: 11px; color: #999; margin-top: 8px;">Error: ${this._faqError}</p>` : '';
                
                container.innerHTML = `
                    <div class="avanti-section-label">FAQs</div>
                    <div class="avanti-empty">
                        <div class="avanti-empty-icon">😕</div>
                        <p>No FAQs available yet.</p>
                        ${errorMsg}
                    </div>
                    <button class="avanti-btn-primary" onclick="AvantiWidget.showForm()">
                        🎫 Raise a Ticket
                    </button>
                `;
                return;
            }

            container.innerHTML = `<div class="avanti-section-label">FAQs</div>`;
            
            this.faqs.forEach(faq => {
                container.innerHTML += `
                    <div class="avanti-faq-card" onclick="AvantiWidget.showFAQAnswer('${faq.id}')">
                        <h4>${faq.question}</h4>
                        <div class="category">${faq.category || 'General'}</div>
                    </div>
                `;
            });
        },
        
        showTickets: function() {
            this.setActiveView('ticketsView');
            this.setActiveNav('navTickets');
            this.loadTickets();
        },
        
        showForm: function() {
            this.setActiveView('formView');
            this.renderForm();
        },
        
        // Load FAQs
        loadFAQs: function() {
            if (!this.firebaseReady) {
                console.log('[AvantiWidget] Firebase not ready, retrying FAQs load...');
                setTimeout(() => this.loadFAQs(), 500);
                return;
            }
            
            console.log('[AvantiWidget] Loading FAQs from helpdesk_faqs collection...');
            
            // Simple query without orderBy to avoid index issues
            firebase.firestore().collection('helpdesk_faqs')
                .limit(50)
                .get()
                .then(snap => {
                    this.faqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    
                    // Sort client-side by 'order' field (if exists) or by question
                    this.faqs.sort((a, b) => {
                        const orderA = a.order ?? 999;
                        const orderB = b.order ?? 999;
                        return orderA - orderB;
                    });
                    
                    console.log('[AvantiWidget] ✓ FAQs loaded:', this.faqs.length, this.faqs);
                    
                    // If user is currently viewing FAQs, refresh the display
                    if (this.currentView === 'faqView') {
                        this.showFAQs();
                    }
                })
                .catch(e => {
                    console.log('[AvantiWidget] FAQ error:', e.code, e.message || e);
                    this.faqs = [];
                    this._faqError = e.message || 'Unknown error';
                    
                    // If user is viewing FAQs, show error
                    if (this.currentView === 'faqView') {
                        this.showFAQs();
                    }
                });
        },
        
        // Search
        searchTopic: function(topic) {
            this.showChat();
            
            const m = document.getElementById('chatMessages');
            m.innerHTML = `
                <div class="avanti-message bot">
                    <div class="avanti-message-bubble">
                        Here's what I found for <strong>${topic}</strong>:
                    </div>
                </div>
            `;
            
            const filtered = this.faqs.filter(f => 
                f.category?.toLowerCase().includes(topic) ||
                f.question?.toLowerCase().includes(topic) ||
                f.answer?.toLowerCase().includes(topic)
            );
            
            if (filtered.length > 0) {
                filtered.slice(0, 5).forEach(faq => {
                    m.innerHTML += `
                        <div class="avanti-faq-card" onclick="AvantiWidget.showFAQAnswer('${faq.id}')">
                            <h4>${faq.question}</h4>
                            <div class="category">${faq.category || 'General'}</div>
                        </div>
                    `;
                });
            } else {
                m.innerHTML += `
                    <div class="avanti-message bot">
                        <div class="avanti-message-bubble">
                            No specific FAQs found for "${topic}". Would you like to raise a ticket?
                        </div>
                    </div>
                    <button class="avanti-btn-primary" style="margin: 8px 0; max-width: 85%;" onclick="AvantiWidget.showForm()">🎫 Raise a Ticket</button>
                `;
            }
            
            m.scrollTop = m.scrollHeight;
        },
        
        showFAQAnswer: function(id) {
            const faq = this.faqs.find(f => f.id === id);
            if (!faq) return;
            
            const m = document.getElementById('chatMessages');
            m.innerHTML += `
                <div class="avanti-message user">
                    <div class="avanti-message-bubble">${faq.question}</div>
                </div>
                <div class="avanti-message bot">
                    <div class="avanti-message-bubble">${faq.answer}</div>
                </div>
            `;
            m.scrollTop = m.scrollHeight;
        },
        
        // Send message
        sendMessage: function() {
            const input = document.getElementById('chatInput');
            const q = input.value.trim();
            if (!q) return;
            
            const m = document.getElementById('chatMessages');
            
            m.innerHTML += `
                <div class="avanti-message user">
                    <div class="avanti-message-bubble">${this.escapeHtml(q)}</div>
                </div>
            `;
            
            input.value = '';
            m.scrollTop = m.scrollHeight;
            
            m.innerHTML += `
                <div class="avanti-typing" id="typing">
                    <div class="avanti-typing-dot"></div>
                    <div class="avanti-typing-dot"></div>
                    <div class="avanti-typing-dot"></div>
                </div>
            `;
            m.scrollTop = m.scrollHeight;
            
            setTimeout(() => {
                document.getElementById('typing')?.remove();
                this.processQuery(q);
            }, 800);
        },
        
        processQuery: function(query) {
            const q = query.toLowerCase().trim();
            const m = document.getElementById('chatMessages');
            
            if (/^(hi|hello|hey|namaste)$/i.test(q)) {
                m.innerHTML += `<div class="avanti-message bot"><div class="avanti-message-bubble">Namaste! 🙏 How can I help you today?</div></div>`;
                m.scrollTop = m.scrollHeight;
                return;
            }
            
            if (q.includes('thank')) {
                m.innerHTML += `<div class="avanti-message bot"><div class="avanti-message-bubble">You're welcome! 😊 Happy to help.</div></div>`;
                m.scrollTop = m.scrollHeight;
                return;
            }
            
            const words = q.split(/\s+/).filter(w => w.length > 2);
            const results = this.faqs.filter(f => {
                const text = `${f.question} ${f.answer}`.toLowerCase();
                return words.filter(w => text.includes(w)).length >= 1;
            }).slice(0, 3);
            
            if (results.length > 0) {
                m.innerHTML += `<div class="avanti-message bot"><div class="avanti-message-bubble">Here's what I found:</div></div>`;
                results.forEach(faq => {
                    m.innerHTML += `
                        <div class="avanti-faq-card" onclick="AvantiWidget.showFAQAnswer('${faq.id}')">
                            <h4>${faq.question}</h4>
                            <div class="category">${faq.category || 'General'}</div>
                        </div>
                    `;
                });
            } else {
                m.innerHTML += `
                    <div class="avanti-message bot">
                        <div class="avanti-message-bubble">
                            I couldn't find a specific answer. Would you like to raise a support ticket?
                        </div>
                    </div>
                    <button class="avanti-btn-primary" style="margin: 8px 0; max-width: 85%;" onclick="AvantiWidget.showForm()">🎫 Raise a Ticket</button>
                `;
            }
            
            m.scrollTop = m.scrollHeight;
        },
        
        escapeHtml: function(t) {
            const d = document.createElement('div');
            d.textContent = t;
            return d.innerHTML;
        },
        
        // Tickets
        loadTickets: function() {
            const list = document.getElementById('ticketsList');
            
            // Wait for user detection
            if (!this.user) {
                list.innerHTML = `
                    <div class="avanti-empty">
                        <div class="avanti-empty-icon">⏳</div>
                        <p>Loading your tickets...</p>
                    </div>
                `;
                setTimeout(() => this.loadTickets(), 500);
                return;
            }
            
            if (!this.firebaseReady) {
                list.innerHTML = `
                    <div class="avanti-empty">
                        <div class="avanti-empty-icon">🎫</div>
                        <p>No tickets yet. Raise one if you need help!</p>
                    </div>
                    <button class="avanti-btn-primary" style="margin: 0 16px; width: calc(100% - 32px);" onclick="AvantiWidget.showForm()">🎫 Raise a Ticket</button>
                `;
                return;
            }
            
            list.innerHTML = '<div class="avanti-empty"><div class="avanti-empty-icon">⏳</div><p>Loading tickets...</p></div>';
            
            console.log('[AvantiWidget] Loading tickets for user:', this.user);
            
            // First try: Simple query without any filters (to test if collection is accessible)
            firebase.firestore().collection('helpdesk_tickets')
                .limit(50)
                .get()
                .then(snap => {
                    console.log('[AvantiWidget] Total tickets in collection:', snap.size);
                    
                    // Filter client-side based on user
                    let userTickets = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
                    
                    // Filter by user
                    if (this.user.type === 'student' && this.user.studentId) {
                        const studentIdStr = String(this.user.studentId);
                        userTickets = userTickets.filter(t => 
                            String(t.studentId) === studentIdStr
                        );
                        console.log('[AvantiWidget] Filtered for student ID:', studentIdStr, '- Found:', userTickets.length);
                    } else if (this.user.type === 'teacher' && this.user.email) {
                        userTickets = userTickets.filter(t => 
                            t.userEmail === this.user.email
                        );
                        console.log('[AvantiWidget] Filtered for email:', this.user.email, '- Found:', userTickets.length);
                    } else if (this.user.name) {
                        userTickets = userTickets.filter(t => 
                            t.userName === this.user.name
                        );
                        console.log('[AvantiWidget] Filtered for name:', this.user.name, '- Found:', userTickets.length);
                    }
                    
                    // Sort by createdAt (newest first)
                    userTickets.sort((a, b) => {
                        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                        return dateB - dateA;
                    });
                    
                    this.tickets = userTickets;
                    console.log('[AvantiWidget] ✓ Tickets loaded:', this.tickets.length);
                    this.renderTicketsList(this.tickets);
                    this.updateTicketsBadge();
                })
                .catch(e => {
                    console.log('[AvantiWidget] Tickets error:', e.code, e.message);
                    list.innerHTML = `
                        <div class="avanti-empty">
                            <div class="avanti-empty-icon">😕</div>
                            <p>Could not load tickets</p>
                            <p style="font-size: 11px; color: #999; margin-top: 8px;">${e.code || ''}: ${e.message || 'Unknown error'}</p>
                        </div>
                        <button class="avanti-btn-primary" style="margin: 20px 16px; width: calc(100% - 32px);" onclick="AvantiWidget.showForm()">🎫 Raise a Ticket</button>
                    `;
                });
        },
        
        renderTicketsList: function(tickets) {
            const list = document.getElementById('ticketsList');
            
            if (!tickets || tickets.length === 0) {
                list.innerHTML = `
                    <div class="avanti-empty">
                        <div class="avanti-empty-icon">🎫</div>
                        <p>No tickets yet. Raise one if you need help!</p>
                    </div>
                    <button class="avanti-btn-primary" style="margin: 0 16px; width: calc(100% - 32px);" onclick="AvantiWidget.showForm()">🎫 Raise a Ticket</button>
                `;
                return;
            }
            
            list.innerHTML = tickets.map(t => `
                <div class="avanti-ticket-card" onclick="AvantiWidget.viewTicket('${t.docId}')">
                    <div class="avanti-ticket-icon">🎫</div>
                    <div class="avanti-ticket-content">
                        <div class="avanti-ticket-top">
                            <span class="avanti-ticket-id">#${t.ticketId || t.docId.substring(0, 8)}</span>
                            <span class="avanti-ticket-status ${t.status}">${t.status}</span>
                        </div>
                        <div class="avanti-ticket-subject">${t.subject || 'No subject'}</div>
                        <div class="avanti-ticket-meta">
                            ${this.formatDate(t.createdAt)} • ${t.replies?.length || 0} replies
                        </div>
                    </div>
                </div>
            `).join('');
        },
        
        updateTicketsBadge: function() {
            const open = this.tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
            const badge = document.getElementById('ticketsBadge');
            
            if (badge) {
                if (open > 0) {
                    badge.textContent = open;
                    badge.classList.add('show');
                } else {
                    badge.classList.remove('show');
                }
            }
        },
        
        formatDate: function(ts) {
            if (!ts) return '';
            const date = ts.toDate ? ts.toDate() : new Date(ts);
            const now = new Date();
            const diff = Math.floor((now - date) / 1000);
            
            if (diff < 60) return 'Just now';
            if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
            if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
            if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
            
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        },
        
        viewTicket: function(docId) {
            const t = this.tickets.find(x => x.docId === docId);
            if (!t) return;
            
            this.setActiveView('formView');
            const fc = document.getElementById('formContent');
            
            let replies = '';
            if (t.replies && t.replies.length > 0) {
                replies = t.replies.map(r => `
                    <div class="avanti-message ${r.isAdmin ? 'bot' : 'user'}">
                        <div class="avanti-message-bubble">
                            ${r.message}
                            <div style="font-size: 11px; opacity: 0.7; margin-top: 6px;">
                                ${r.isAdmin ? 'Support' : 'You'} • ${this.formatDate(r.timestamp)}
                            </div>
                        </div>
                    </div>
                `).join('');
            }
            
            // Determine status display and actions
            const isResolved = t.status === 'resolved';
            const statusColor = isResolved ? '#10B981' : (t.status === 'in-progress' ? '#F59E0B' : '#3B82F6');
            
            fc.innerHTML = `
                <button class="avanti-back-btn" onclick="AvantiWidget.showTickets()">← Back</button>
                
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
                        <span class="avanti-ticket-id" style="font-size: 16px;">#${t.ticketId || docId.substring(0, 8)}</span>
                        <span class="avanti-ticket-status ${t.status}">${t.status}</span>
                    </div>
                    <h2 style="font-size: 18px; font-weight: 700; color: var(--km-text);">${t.subject || 'No subject'}</h2>
                    <p style="font-size: 13px; color: var(--km-text-muted); margin-top: 4px;">
                        Created ${this.formatDate(t.createdAt)}
                    </p>
                </div>
                
                <div style="background: #FFFFFF; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid var(--km-border);">
                    <p style="font-size: 14px; color: var(--km-text); line-height: 1.6;">
                        ${t.description || 'No description'}
                    </p>
                </div>
                
                ${t.screenshotUrl ? `
                    <div style="margin-bottom: 20px;">
                        <img src="${t.screenshotUrl}" style="width: 100%; border-radius: 12px; border: 1px solid var(--km-border);" alt="Screenshot">
                    </div>
                ` : ''}
                
                ${replies ? `
                    <div style="margin-bottom: 20px;">
                        <h3 style="font-size: 14px; font-weight: 600; color: var(--km-text); margin-bottom: 12px;">Conversation</h3>
                        ${replies}
                    </div>
                ` : ''}
                
                ${!isResolved ? `
                    <div class="avanti-form-group">
                        <label class="avanti-form-label">Add Reply</label>
                        <textarea class="avanti-form-textarea" id="ticketReply" placeholder="Type your reply..."></textarea>
                    </div>
                    <button class="avanti-btn-primary" onclick="AvantiWidget.sendTicketReply('${docId}')">Send Reply</button>
                    
                    <button class="avanti-btn-secondary" style="background: #FEE2E2; color: #DC2626; border-color: #FECACA;" onclick="AvantiWidget.closeTicket('${docId}')">
                        ✕ Close Ticket
                    </button>
                ` : `
                    <div style="text-align: center; padding: 20px; background: #D1FAE5; border-radius: 12px; margin-bottom: 12px;">
                        <span style="font-size: 24px;">✅</span>
                        <p style="color: #065F46; font-weight: 600; margin-top: 8px;">Ticket resolved</p>
                    </div>
                    
                    <button class="avanti-btn-secondary" style="background: #DBEAFE; color: #2563EB; border-color: #BFDBFE;" onclick="AvantiWidget.reopenTicket('${docId}')">
                        🔄 Reopen Ticket
                    </button>
                `}
            `;
        },
        
        sendTicketReply: async function(docId) {
            const replyInput = document.getElementById('ticketReply');
            const reply = replyInput?.value.trim();
            if (!reply) return alert('Please enter a reply');
            
            // Disable input while sending
            if (replyInput) replyInput.disabled = true;
            
            const newReply = {
                message: reply,
                isAdmin: false,
                userName: this.user?.name || 'User',
                timestamp: new Date().toISOString()
            };
            
            try {
                await firebase.firestore().collection('helpdesk_tickets').doc(docId).update({
                    replies: firebase.firestore.FieldValue.arrayUnion(newReply),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Update local ticket data immediately for instant feedback
                const ticket = this.tickets.find(t => t.docId === docId);
                if (ticket) {
                    if (!ticket.replies) ticket.replies = [];
                    ticket.replies.push(newReply);
                }
                
                // Re-render the ticket view with updated data
                this.viewTicket(docId);
                this.showToast('Reply sent! ✓');
                
            } catch (e) {
                console.log('[AvantiWidget] Reply error:', e);
                alert('Failed to send reply');
                if (replyInput) replyInput.disabled = false;
            }
        },
        
        // Close ticket by user
        closeTicket: async function(docId) {
            if (!confirm('Are you sure you want to close this ticket?')) return;
            
            try {
                await firebase.firestore().collection('helpdesk_tickets').doc(docId).update({
                    status: 'resolved',
                    resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    resolvedBy: 'user',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Update local data
                const ticket = this.tickets.find(t => t.docId === docId);
                if (ticket) ticket.status = 'resolved';
                
                this.viewTicket(docId);
                this.updateTicketsBadge();
                this.showToast('Ticket closed ✓');
                
            } catch (e) {
                console.log('[AvantiWidget] Close ticket error:', e);
                alert('Failed to close ticket');
            }
        },
        
        // Reopen ticket by user
        reopenTicket: async function(docId) {
            try {
                await firebase.firestore().collection('helpdesk_tickets').doc(docId).update({
                    status: 'open',
                    reopenedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Update local data
                const ticket = this.tickets.find(t => t.docId === docId);
                if (ticket) ticket.status = 'open';
                
                this.viewTicket(docId);
                this.updateTicketsBadge();
                this.showToast('Ticket reopened ✓');
                
            } catch (e) {
                console.log('[AvantiWidget] Reopen ticket error:', e);
                alert('Failed to reopen ticket');
            }
        },
        
        // Form
        renderForm: function() {
            const fc = document.getElementById('formContent');
            
            let userInfo = '';
            if (this.user) {
                userInfo = `
                    <div class="avanti-user-card">
                        <div class="avanti-user-card-title">Your Information</div>
                        <div class="avanti-user-row">
                            <span class="label">Name</span>
                            <span class="value">${this.user.name || 'Not set'}</span>
                        </div>
                        <div class="avanti-user-row">
                            <span class="label">${this.user.type === 'student' ? 'Student ID' : 'Email'}</span>
                            <span class="value">${this.user.type === 'student' ? (this.user.studentId || 'N/A') : (this.user.email || 'N/A')}</span>
                        </div>
                        <div class="avanti-user-row">
                            <span class="label">School</span>
                            <span class="value">${this.user.school || 'Not set'}</span>
                        </div>
                    </div>
                `;
            }
            
            fc.innerHTML = `
                <button class="avanti-back-btn" onclick="AvantiWidget.showWelcome()">← Back</button>
                
                <h2 class="avanti-form-title">🎫 Raise a Ticket</h2>
                
                ${userInfo}
                
                ${!this.user ? `
                    <div class="avanti-form-group">
                        <label class="avanti-form-label">Your Name *</label>
                        <input type="text" class="avanti-form-input" id="formName" placeholder="Enter your name">
                    </div>
                    <div class="avanti-form-group">
                        <label class="avanti-form-label">Student ID (if student)</label>
                        <input type="text" class="avanti-form-input" id="formStudentId" placeholder="Enter student ID">
                    </div>
                    <div class="avanti-form-group">
                        <label class="avanti-form-label">Email (if teacher)</label>
                        <input type="email" class="avanti-form-input" id="formEmail" placeholder="Enter email">
                    </div>
                    <div class="avanti-form-group">
                        <label class="avanti-form-label">School *</label>
                        <input type="text" class="avanti-form-input" id="formSchool" placeholder="Enter school name">
                    </div>
                ` : ''}
                
                <div class="avanti-form-group">
                    <label class="avanti-form-label">Category *</label>
                    <select class="avanti-form-select" id="formCategory">
                        <option value="login">Login Issues</option>
                        <option value="attendance">Attendance</option>
                        <option value="curriculum">Curriculum</option>
                        <option value="technical">Technical Problem</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="avanti-form-group">
                    <label class="avanti-form-label">Subject *</label>
                    <input type="text" class="avanti-form-input" id="formSubject" placeholder="Brief description">
                </div>
                
                <div class="avanti-form-group">
                    <label class="avanti-form-label">Description *</label>
                    <textarea class="avanti-form-textarea" id="formDesc" placeholder="Describe your issue..."></textarea>
                </div>
                
                <div class="avanti-form-group">
                    <label class="avanti-form-label">Screenshot (optional)</label>
                    <div class="avanti-screenshot-zone" onclick="document.getElementById('ssInput').click()">
                        <div class="icon">📷</div>
                        <p>Click to upload</p>
                    </div>
                    <input type="file" id="ssInput" accept="image/*" style="display: none;" onchange="AvantiWidget.handleScreenshot(this)">
                    
                    <div class="avanti-screenshot-preview" id="ssPreview">
                        <img id="ssImg" src="">
                        <button class="avanti-screenshot-remove" onclick="AvantiWidget.removeScreenshot()">×</button>
                    </div>
                    
                    <div class="avanti-progress" id="ssProgress">
                        <div class="avanti-progress-bar">
                            <div class="avanti-progress-fill" id="ssFill"></div>
                        </div>
                        <div class="avanti-progress-text" id="ssText">Processing...</div>
                    </div>
                </div>
                
                <button class="avanti-submit-btn" id="submitBtn" onclick="AvantiWidget.${this.user ? 'submitTicket' : 'submitTicketManual'}()">
                    🎫 Submit Ticket
                </button>
            `;
        },
        
        handleScreenshot: function(input) {
            const file = input.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) return alert('Please select an image');
            if (file.size > 5 * 1024 * 1024) return alert('Image must be less than 5MB');
            
            this.isUploadingScreenshot = true;
            
            const prog = document.getElementById('ssProgress');
            const fill = document.getElementById('ssFill');
            const text = document.getElementById('ssText');
            
            prog.style.display = 'block';
            fill.style.width = '0%';
            text.textContent = 'Processing...';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    fill.style.width = '50%';
                    text.textContent = 'Compressing...';
                    
                    const canvas = document.createElement('canvas');
                    const max = 1200;
                    let { width, height } = img;
                    
                    if (width > max || height > max) {
                        if (width > height) {
                            height = (height / width) * max;
                            width = max;
                        } else {
                            width = (width / height) * max;
                            height = max;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(blob => {
                        this.screenshotFile = new File([blob], 'screenshot.jpg', { type: 'image/jpeg' });
                        this.screenshotDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                        
                        document.getElementById('ssImg').src = this.screenshotDataUrl;
                        document.getElementById('ssPreview').style.display = 'block';
                        
                        fill.style.width = '100%';
                        text.textContent = '✓ Ready!';
                        
                        setTimeout(() => {
                            prog.style.display = 'none';
                            this.isUploadingScreenshot = false;
                        }, 500);
                    }, 'image/jpeg', 0.85);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },
        
        removeScreenshot: function() {
            this.screenshotFile = null;
            this.screenshotDataUrl = null;
            document.getElementById('ssPreview').style.display = 'none';
            document.getElementById('ssInput').value = '';
            document.getElementById('ssProgress').style.display = 'none';
        },
        
        uploadScreenshot: async function(ticketId) {
            if (!this.screenshotFile) return null;
            if (!this.firebaseReady) return this.screenshotDataUrl || null;
            
            try {
                const ref = firebase.storage().ref();
                const fileRef = ref.child(`helpdesk_screenshots/${ticketId}_${Date.now()}.jpg`);
                
                return new Promise((resolve, reject) => {
                    fileRef.put(this.screenshotFile).on('state_changed',
                        null, reject,
                        async () => resolve(await fileRef.getDownloadURL())
                    );
                });
            } catch (e) {
                return this.screenshotDataUrl || null;
            }
        },
        
        submitTicket: async function() {
            if (this.isUploadingScreenshot) return alert('Wait for screenshot...');
            if (!this.firebaseReady) return alert('Connecting...');
            
            const btn = document.getElementById('submitBtn');
            const subject = document.getElementById('formSubject').value.trim();
            const desc = document.getElementById('formDesc').value.trim();
            const category = document.getElementById('formCategory').value;
            
            if (!subject || !desc) return alert('Fill all required fields');
            
            btn.disabled = true;
            btn.innerHTML = '<span class="avanti-spinner"></span> Submitting...';
            
            try {
                const ticketId = 'AV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
                
                let ssUrl = null;
                if (this.screenshotFile) {
                    btn.innerHTML = '<span class="avanti-spinner"></span> Uploading...';
                    ssUrl = await this.uploadScreenshot(ticketId);
                }
                
                await firebase.firestore().collection('helpdesk_tickets').add({
                    ticketId,
                    userName: this.user.name,
                    userEmail: this.user.email || '',
                    studentId: this.user.studentId || null,
                    school: this.user.school,
                    userRole: this.user.type === 'student' ? 'Student' : 'Teacher',
                    userGrade: this.user.grade || null,
                    category, subject, description: desc,
                    screenshotUrl: ssUrl,
                    status: 'open',
                    priority: 'medium',
                    replies: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                this.loadTickets();
                this.showSuccess(ticketId);
            } catch (e) {
                alert('Failed to submit');
                btn.disabled = false;
                btn.innerHTML = '🎫 Submit Ticket';
            }
        },
        
        submitTicketManual: async function() {
            if (this.isUploadingScreenshot) return alert('Wait for screenshot...');
            if (!this.firebaseReady) return alert('Connecting...');
            
            const btn = document.getElementById('submitBtn');
            const name = document.getElementById('formName').value.trim();
            const studentId = document.getElementById('formStudentId').value.trim();
            const email = document.getElementById('formEmail').value.trim();
            const school = document.getElementById('formSchool').value.trim();
            const subject = document.getElementById('formSubject').value.trim();
            const desc = document.getElementById('formDesc').value.trim();
            const category = document.getElementById('formCategory').value;
            
            if (!name || !school || !subject || !desc) return alert('Fill all required fields');
            
            btn.disabled = true;
            btn.innerHTML = '<span class="avanti-spinner"></span> Submitting...';
            
            try {
                const ticketId = 'AV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
                
                let ssUrl = null;
                if (this.screenshotFile) {
                    btn.innerHTML = '<span class="avanti-spinner"></span> Uploading...';
                    ssUrl = await this.uploadScreenshot(ticketId);
                }
                
                await firebase.firestore().collection('helpdesk_tickets').add({
                    ticketId,
                    userName: name,
                    userEmail: email || '',
                    studentId: studentId || null,
                    school,
                    userRole: studentId ? 'Student' : (email ? 'Teacher' : 'Unknown'),
                    category, subject, description: desc,
                    screenshotUrl: ssUrl,
                    status: 'open',
                    priority: 'medium',
                    replies: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                this.showSuccess(ticketId);
            } catch (e) {
                alert('Failed to submit');
                btn.disabled = false;
                btn.innerHTML = '🎫 Submit Ticket';
            }
        },
        
        showSuccess: function(ticketId) {
            document.getElementById('formContent').innerHTML = `
                <div class="avanti-success">
                    <div class="icon">✅</div>
                    <h3>Ticket Submitted!</h3>
                    <div class="ticket-id">${ticketId}</div>
                    <p>We'll notify you when there's an update.</p>
                    <button class="avanti-btn-primary" onclick="AvantiWidget.showTickets()">View Tickets</button>
                    <button class="avanti-btn-secondary" onclick="AvantiWidget.showWelcome()">Back to Home</button>
                </div>
            `;
        },
        
        updateNotificationBadge: function() {
            const badge = document.getElementById('fabBadge');
            if (badge && this.unreadNotifications > 0) {
                badge.textContent = this.unreadNotifications;
                badge.classList.add('show');
            } else if (badge) {
                badge.classList.remove('show');
            }
        },
        
        showToast: function(msg, duration = 4000) {
            let toast = document.querySelector('.avanti-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.className = 'avanti-toast';
                document.body.appendChild(toast);
            }
            
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), duration);
        }
    };

    // Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AvantiWidget.init());
    } else {
        AvantiWidget.init();
    }
})();
