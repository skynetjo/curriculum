/**
 * ============================================
 * AVANTI HELP DESK WIDGET v6.0 - KOMMUNICATE STYLE
 * ============================================
 * 
 * Modern, beautiful chat widget inspired by Kommunicate.io
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
    // INJECT CSS STYLES - KOMMUNICATE INSPIRED
    // ============================================
    const styleEl = document.createElement('style');
    styleEl.id = 'avanti-widget-styles';
    styleEl.textContent = `
/* ============================================
   AVANTI WIDGET v6.0 - KOMMUNICATE STYLE
   Modern, Beautiful, Professional
   ============================================ */

:root {
    --avanti-primary: #F4B41A;
    --avanti-primary-dark: #E8A317;
    --avanti-primary-light: #FFF7E0;
    --avanti-gradient: linear-gradient(135deg, #F4B41A 0%, #FF9800 100%);
    --avanti-accent: #6366F1;
    --avanti-accent-light: #EEF2FF;
    --avanti-bg: #FFFFFF;
    --avanti-bg-soft: #F8FAFC;
    --avanti-bg-card: #FFFFFF;
    --avanti-text: #1A1D26;
    --avanti-text-secondary: #6B7280;
    --avanti-text-muted: #9CA3AF;
    --avanti-border: #E5E7EB;
    --avanti-border-light: #F3F4F6;
    --avanti-success: #10B981;
    --avanti-error: #EF4444;
    --avanti-warning: #F59E0B;
    --avanti-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --avanti-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    --avanti-shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    --avanti-shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    --avanti-radius: 16px;
    --avanti-radius-lg: 24px;
    --avanti-radius-full: 9999px;
}

/* Reset for widget */
.avanti-widget-container * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
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
    border-radius: var(--avanti-radius-full);
    background: var(--avanti-gradient);
    border: none;
    cursor: pointer;
    box-shadow: 0 8px 32px rgba(244, 180, 26, 0.4);
    z-index: 99990;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
}

.avanti-fab:hover {
    transform: scale(1.08);
    box-shadow: 0 12px 40px rgba(244, 180, 26, 0.5);
}

.avanti-fab:active {
    transform: scale(0.95);
}

.avanti-fab svg {
    width: 28px;
    height: 28px;
    fill: #1A1D26;
    transition: all 0.3s ease;
}

.avanti-fab.open svg.icon-chat { display: none; }
.avanti-fab.open svg.icon-close { display: block; transform: rotate(0deg); }
.avanti-fab svg.icon-close { display: none; }

/* Notification Badge */
.avanti-fab-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 22px;
    height: 22px;
    background: var(--avanti-error);
    border-radius: var(--avanti-radius-full);
    border: 3px solid #fff;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    font-family: 'Inter', sans-serif;
    animation: badgePop 0.3s ease;
}

.avanti-fab-badge.show { display: flex; }

@keyframes badgePop {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

/* ============================================
   GREETING BUBBLE
   ============================================ */
.avanti-greeting {
    position: fixed;
    bottom: 100px;
    right: 24px;
    background: var(--avanti-bg);
    border-radius: var(--avanti-radius);
    padding: 16px 20px;
    max-width: 280px;
    box-shadow: var(--avanti-shadow-xl);
    z-index: 99985;
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px) scale(0.95);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--avanti-border-light);
    font-family: 'Inter', sans-serif;
}

.avanti-greeting::after {
    content: '';
    position: absolute;
    bottom: -8px;
    right: 28px;
    width: 16px;
    height: 16px;
    background: var(--avanti-bg);
    transform: rotate(45deg);
    border-right: 1px solid var(--avanti-border-light);
    border-bottom: 1px solid var(--avanti-border-light);
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
    background: var(--avanti-bg-soft);
    border-radius: var(--avanti-radius-full);
    cursor: pointer;
    color: var(--avanti-text-muted);
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.avanti-greeting-close:hover {
    background: var(--avanti-border);
    color: var(--avanti-text);
}

.avanti-greeting-text {
    font-size: 14px;
    line-height: 1.5;
    color: var(--avanti-text);
    padding-right: 20px;
}

/* ============================================
   MAIN PANEL
   ============================================ */
.avanti-panel {
    position: fixed;
    bottom: 100px;
    right: 24px;
    width: 400px;
    height: 620px;
    max-height: calc(100vh - 120px);
    background: var(--avanti-bg-soft);
    border-radius: var(--avanti-radius-lg);
    box-shadow: var(--avanti-shadow-xl);
    z-index: 99995;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px) scale(0.95);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Inter', sans-serif;
    border: 1px solid var(--avanti-border-light);
}

.avanti-panel.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
}

/* Mobile Responsive */
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
   HEADER
   ============================================ */
.avanti-header {
    background: var(--avanti-gradient);
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
    border-radius: var(--avanti-radius-full);
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
    border-radius: var(--avanti-radius-full);
    object-fit: cover;
}

.avanti-header-avatar .online-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    background: var(--avanti-success);
    border-radius: var(--avanti-radius-full);
    border: 2px solid #F4B41A;
}

.avanti-header-info h1 {
    font-size: 16px;
    font-weight: 700;
    color: #1A1D26;
    margin-bottom: 2px;
}

.avanti-header-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: rgba(26, 29, 38, 0.7);
}

.avanti-header-status::before {
    content: '';
    width: 8px;
    height: 8px;
    background: var(--avanti-success);
    border-radius: var(--avanti-radius-full);
}

.avanti-header-close {
    width: 36px;
    height: 36px;
    border-radius: var(--avanti-radius);
    background: rgba(255, 255, 255, 0.2);
    border: none;
    cursor: pointer;
    color: #1A1D26;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.avanti-header-close:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* ============================================
   BODY CONTAINER
   ============================================ */
.avanti-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--avanti-bg-soft);
}

/* ============================================
   WELCOME VIEW - KOMMUNICATE STYLE
   ============================================ */
.avanti-view {
    display: none;
    flex-direction: column;
    height: 100%;
    animation: viewFadeIn 0.3s ease;
}

.avanti-view.active {
    display: flex;
}

@keyframes viewFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

.avanti-welcome-view {
    padding: 20px;
    overflow-y: auto;
}

/* Hero Card */
.avanti-hero-card {
    background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
    border-radius: var(--avanti-radius-lg);
    padding: 28px 24px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
}

.avanti-hero-card::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    pointer-events: none;
}

.avanti-hero-emoji {
    font-size: 40px;
    margin-bottom: 12px;
}

.avanti-hero-title {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
}

.avanti-hero-text {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    line-height: 1.3;
    margin-bottom: 20px;
}

/* Search Box in Hero */
.avanti-search-box {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.95);
    border-radius: var(--avanti-radius-full);
    padding: 12px 18px;
    cursor: pointer;
    transition: all 0.2s;
}

.avanti-search-box:hover {
    background: #fff;
    box-shadow: var(--avanti-shadow);
}

.avanti-search-box svg {
    width: 20px;
    height: 20px;
    fill: var(--avanti-text-muted);
    margin-right: 12px;
    flex-shrink: 0;
}

.avanti-search-box span {
    color: var(--avanti-text-muted);
    font-size: 14px;
    flex: 1;
}

/* Section Title */
.avanti-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--avanti-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
    padding-left: 4px;
}

/* Help Text Below Hero */
.avanti-help-text {
    text-align: center;
    padding: 16px 0;
    color: var(--avanti-text-secondary);
    font-size: 14px;
}

/* Quick Action Cards */
.avanti-quick-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.avanti-quick-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: var(--avanti-bg-card);
    border: 1px solid var(--avanti-border-light);
    border-radius: var(--avanti-radius);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-family: inherit;
}

.avanti-quick-card:hover {
    border-color: var(--avanti-primary);
    background: var(--avanti-primary-light);
    transform: translateX(4px);
}

.avanti-quick-card-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}

.avanti-quick-card-icon.login { background: linear-gradient(135deg, #FEE2E2, #FECACA); }
.avanti-quick-card-icon.attendance { background: linear-gradient(135deg, #E0F2FE, #BAE6FD); }
.avanti-quick-card-icon.curriculum { background: linear-gradient(135deg, #F0FDF4, #BBF7D0); }
.avanti-quick-card-icon.ticket { background: linear-gradient(135deg, #FEF3C7, #FDE68A); }

.avanti-quick-card-content {
    flex: 1;
    min-width: 0;
}

.avanti-quick-card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--avanti-text);
    margin-bottom: 2px;
}

.avanti-quick-card-desc {
    font-size: 12px;
    color: var(--avanti-text-muted);
}

.avanti-quick-card-arrow {
    color: var(--avanti-text-muted);
    font-size: 18px;
    transition: all 0.2s;
}

.avanti-quick-card:hover .avanti-quick-card-arrow {
    color: var(--avanti-primary-dark);
    transform: translateX(4px);
}

/* View Conversations Button */
.avanti-conversations-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px 20px;
    background: var(--avanti-accent);
    color: #fff;
    border: none;
    border-radius: var(--avanti-radius-full);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 20px;
    font-family: inherit;
}

.avanti-conversations-btn:hover {
    background: #4F46E5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

/* ============================================
   CHAT VIEW
   ============================================ */
.avanti-chat-view {
    background: var(--avanti-bg);
}

.avanti-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--avanti-bg-soft);
}

/* Message Bubbles */
.avanti-message {
    max-width: 85%;
    animation: msgSlide 0.3s ease;
}

@keyframes msgSlide {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.avanti-message.bot {
    align-self: flex-start;
}

.avanti-message.user {
    align-self: flex-end;
}

.avanti-message-bubble {
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.5;
}

.avanti-message.bot .avanti-message-bubble {
    background: var(--avanti-bg-card);
    color: var(--avanti-text);
    border: 1px solid var(--avanti-border-light);
    border-bottom-left-radius: 6px;
}

.avanti-message.user .avanti-message-bubble {
    background: linear-gradient(135deg, var(--avanti-accent), #8B5CF6);
    color: #fff;
    border-bottom-right-radius: 6px;
}

/* Typing Indicator */
.avanti-typing {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 16px;
    background: var(--avanti-bg-card);
    border: 1px solid var(--avanti-border-light);
    border-radius: 18px;
    border-bottom-left-radius: 6px;
    width: fit-content;
}

.avanti-typing-dot {
    width: 8px;
    height: 8px;
    background: var(--avanti-text-muted);
    border-radius: var(--avanti-radius-full);
    animation: typingBounce 1.4s ease-in-out infinite;
}

.avanti-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.avanti-typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
}

/* Chat Input */
.avanti-chat-input-wrapper {
    padding: 12px 16px;
    background: var(--avanti-bg);
    border-top: 1px solid var(--avanti-border-light);
    display: flex;
    align-items: center;
    gap: 12px;
}

.avanti-chat-input {
    flex: 1;
    padding: 12px 18px;
    background: var(--avanti-bg-soft);
    border: 1px solid var(--avanti-border);
    border-radius: var(--avanti-radius-full);
    font-size: 14px;
    font-family: inherit;
    color: var(--avanti-text);
    transition: all 0.2s;
}

.avanti-chat-input:focus {
    outline: none;
    border-color: var(--avanti-primary);
    box-shadow: 0 0 0 3px rgba(244, 180, 26, 0.15);
}

.avanti-chat-input::placeholder {
    color: var(--avanti-text-muted);
}

.avanti-chat-send {
    width: 44px;
    height: 44px;
    border-radius: var(--avanti-radius-full);
    background: var(--avanti-gradient);
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
    box-shadow: 0 4px 12px rgba(244, 180, 26, 0.4);
}

.avanti-chat-send svg {
    width: 20px;
    height: 20px;
    fill: #1A1D26;
}

/* FAQ Card in Chat */
.avanti-faq-card {
    background: var(--avanti-bg-card);
    border: 1px solid var(--avanti-border-light);
    border-radius: var(--avanti-radius);
    padding: 14px 16px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 8px;
}

.avanti-faq-card:hover {
    border-color: var(--avanti-primary);
    background: var(--avanti-primary-light);
}

.avanti-faq-card h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--avanti-text);
    margin-bottom: 4px;
}

.avanti-faq-card .category {
    font-size: 11px;
    color: var(--avanti-primary-dark);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
}

/* ============================================
   TICKETS VIEW
   ============================================ */
.avanti-tickets-view {
    background: var(--avanti-bg);
}

.avanti-tickets-header {
    padding: 20px;
    border-bottom: 1px solid var(--avanti-border-light);
}

.avanti-tickets-header h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--avanti-text);
}

.avanti-tickets-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
}

/* Ticket Card */
.avanti-ticket-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px;
    background: var(--avanti-bg-card);
    border: 1px solid var(--avanti-border-light);
    border-radius: var(--avanti-radius);
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.avanti-ticket-card:hover {
    border-color: var(--avanti-primary);
    background: var(--avanti-primary-light);
}

.avanti-ticket-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #E0F2FE, #BAE6FD);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
}

.avanti-ticket-content {
    flex: 1;
    min-width: 0;
}

.avanti-ticket-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.avanti-ticket-id {
    font-family: 'SF Mono', 'Consolas', monospace;
    font-size: 12px;
    font-weight: 600;
    color: var(--avanti-text);
}

.avanti-ticket-status {
    padding: 3px 8px;
    border-radius: var(--avanti-radius-full);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.avanti-ticket-status.open { background: #FEE2E2; color: #DC2626; }
.avanti-ticket-status.in-progress { background: #FEF3C7; color: #D97706; }
.avanti-ticket-status.resolved { background: #D1FAE5; color: #059669; }

.avanti-ticket-subject {
    font-size: 14px;
    font-weight: 600;
    color: var(--avanti-text);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.avanti-ticket-meta {
    font-size: 12px;
    color: var(--avanti-text-muted);
}

/* Empty State */
.avanti-empty-state {
    text-align: center;
    padding: 48px 24px;
}

.avanti-empty-state .icon {
    font-size: 56px;
    margin-bottom: 16px;
    opacity: 0.5;
}

.avanti-empty-state p {
    color: var(--avanti-text-muted);
    font-size: 14px;
}

/* ============================================
   FORM VIEW
   ============================================ */
.avanti-form-view {
    background: var(--avanti-bg);
}

.avanti-form-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

/* User Info Card */
.avanti-user-card {
    background: linear-gradient(135deg, #D1FAE5, #A7F3D0);
    border: 1px solid #6EE7B7;
    border-radius: var(--avanti-radius);
    padding: 16px;
    margin-bottom: 20px;
}

.avanti-user-card-title {
    font-size: 12px;
    font-weight: 600;
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

.avanti-user-row .label { color: #047857; font-weight: 500; }
.avanti-user-row .value { color: #065F46; font-weight: 600; }

/* Form Group */
.avanti-form-group {
    margin-bottom: 18px;
}

.avanti-form-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--avanti-text);
    margin-bottom: 8px;
}

.avanti-form-input,
.avanti-form-select,
.avanti-form-textarea {
    width: 100%;
    padding: 12px 16px;
    background: var(--avanti-bg-soft);
    border: 1px solid var(--avanti-border);
    border-radius: 12px;
    font-size: 14px;
    font-family: inherit;
    color: var(--avanti-text);
    transition: all 0.2s;
}

.avanti-form-input:focus,
.avanti-form-select:focus,
.avanti-form-textarea:focus {
    outline: none;
    border-color: var(--avanti-primary);
    box-shadow: 0 0 0 3px rgba(244, 180, 26, 0.15);
}

.avanti-form-textarea {
    min-height: 100px;
    resize: vertical;
}

/* Screenshot Upload */
.avanti-screenshot-area {
    margin-top: 8px;
}

.avanti-screenshot-dropzone {
    border: 2px dashed var(--avanti-border);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
}

.avanti-screenshot-dropzone:hover {
    border-color: var(--avanti-primary);
    background: var(--avanti-primary-light);
}

.avanti-screenshot-dropzone .icon {
    font-size: 32px;
    margin-bottom: 8px;
}

.avanti-screenshot-dropzone p {
    color: var(--avanti-text-muted);
    font-size: 13px;
}

.avanti-screenshot-preview {
    position: relative;
    display: none;
    margin-top: 12px;
}

.avanti-screenshot-preview img {
    width: 100%;
    border-radius: 12px;
    border: 1px solid var(--avanti-border);
}

.avanti-screenshot-remove {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    border-radius: var(--avanti-radius-full);
    background: var(--avanti-error);
    border: none;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Progress Bar */
.avanti-upload-progress {
    margin-top: 12px;
    padding: 12px;
    background: var(--avanti-bg-soft);
    border-radius: 8px;
    display: none;
}

.avanti-progress-bar {
    height: 6px;
    background: var(--avanti-border);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 8px;
}

.avanti-progress-fill {
    height: 100%;
    background: var(--avanti-gradient);
    border-radius: 3px;
    width: 0%;
    transition: width 0.3s ease;
}

.avanti-progress-text {
    font-size: 12px;
    color: var(--avanti-text-muted);
}

/* Submit Button */
.avanti-submit-btn {
    width: 100%;
    padding: 14px 24px;
    background: var(--avanti-gradient);
    color: #1A1D26;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    margin-top: 8px;
}

.avanti-submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(244, 180, 26, 0.4);
}

.avanti-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* Action Buttons */
.avanti-btn-primary {
    width: 100%;
    padding: 14px 24px;
    background: var(--avanti-gradient);
    color: #1A1D26;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
}

.avanti-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(244, 180, 26, 0.4);
}

.avanti-btn-secondary {
    width: 100%;
    padding: 14px 24px;
    background: var(--avanti-bg-soft);
    color: var(--avanti-text);
    border: 1px solid var(--avanti-border);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    margin-top: 10px;
}

.avanti-btn-secondary:hover {
    background: var(--avanti-border-light);
}

/* Success Screen */
.avanti-success-screen {
    text-align: center;
    padding: 48px 24px;
}

.avanti-success-screen .icon {
    font-size: 72px;
    margin-bottom: 20px;
}

.avanti-success-screen h3 {
    font-size: 24px;
    font-weight: 700;
    color: var(--avanti-text);
    margin-bottom: 12px;
}

.avanti-success-screen .ticket-id {
    display: inline-block;
    padding: 8px 16px;
    background: var(--avanti-primary-light);
    color: #92400E;
    font-family: 'SF Mono', 'Consolas', monospace;
    font-size: 14px;
    font-weight: 600;
    border-radius: 8px;
    margin-bottom: 16px;
}

.avanti-success-screen p {
    color: var(--avanti-text-muted);
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 24px;
}

/* ============================================
   BOTTOM NAVIGATION - KOMMUNICATE STYLE
   ============================================ */
.avanti-bottom-nav {
    display: flex;
    background: var(--avanti-bg);
    border-top: 1px solid var(--avanti-border-light);
    padding: 8px 12px;
    gap: 4px;
}

.avanti-nav-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 8px;
    background: transparent;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    position: relative;
}

.avanti-nav-btn:hover {
    background: var(--avanti-bg-soft);
}

.avanti-nav-btn.active {
    background: var(--avanti-accent-light);
}

.avanti-nav-btn.active .avanti-nav-icon {
    color: var(--avanti-accent);
}

.avanti-nav-btn.active .avanti-nav-label {
    color: var(--avanti-accent);
}

.avanti-nav-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
}

.avanti-nav-icon svg {
    width: 22px;
    height: 22px;
    fill: var(--avanti-text-muted);
    transition: all 0.2s;
}

.avanti-nav-btn.active .avanti-nav-icon svg {
    fill: var(--avanti-accent);
}

.avanti-nav-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--avanti-text-muted);
    transition: all 0.2s;
}

.avanti-nav-badge {
    position: absolute;
    top: 4px;
    right: calc(50% - 18px);
    min-width: 18px;
    height: 18px;
    background: var(--avanti-error);
    border-radius: var(--avanti-radius-full);
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
}

.avanti-nav-badge.show { display: flex; }

/* ============================================
   NOTIFICATION TOAST
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
    transition: all 0.3s ease;
    box-shadow: var(--avanti-shadow-lg);
    background: var(--avanti-primary-light);
    color: #92400E;
    border: 1px solid var(--avanti-primary);
    cursor: pointer;
    font-family: 'Inter', sans-serif;
}

.avanti-toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

/* ============================================
   LOADING SPINNER
   ============================================ */
.avanti-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0,0,0,0.2);
    border-top-color: currentColor;
    border-radius: var(--avanti-radius-full);
    animation: spin 0.8s linear infinite;
    margin-right: 8px;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ============================================
   CUSTOM SCROLLBAR
   ============================================ */
.avanti-chat-messages::-webkit-scrollbar,
.avanti-tickets-list::-webkit-scrollbar,
.avanti-form-scroll::-webkit-scrollbar,
.avanti-welcome-view::-webkit-scrollbar {
    width: 6px;
}

.avanti-chat-messages::-webkit-scrollbar-track,
.avanti-tickets-list::-webkit-scrollbar-track,
.avanti-form-scroll::-webkit-scrollbar-track,
.avanti-welcome-view::-webkit-scrollbar-track {
    background: transparent;
}

.avanti-chat-messages::-webkit-scrollbar-thumb,
.avanti-tickets-list::-webkit-scrollbar-thumb,
.avanti-form-scroll::-webkit-scrollbar-thumb,
.avanti-welcome-view::-webkit-scrollbar-thumb {
    background: var(--avanti-border);
    border-radius: 3px;
}

/* Logo Image */
.avanti-logo-img {
    width: 36px;
    height: 36px;
    border-radius: var(--avanti-radius-full);
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
        <!-- Greeting Bubble -->
        <div class="avanti-greeting" id="avantiGreeting">
            <button class="avanti-greeting-close" onclick="event.stopPropagation(); AvantiWidget.hideGreeting()">×</button>
            <div class="avanti-greeting-text" id="greetingText">
                🙏 <strong>Namaste!</strong> Need help with the Curriculum Tracker?
            </div>
        </div>
        
        <!-- Floating Action Button -->
        <button class="avanti-fab" id="avantiFab" onclick="AvantiWidget.toggle()">
            <svg class="icon-chat" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            <svg class="icon-close" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            <span class="avanti-fab-badge" id="fabBadge"></span>
        </button>
        
        <!-- Main Panel -->
        <div class="avanti-panel" id="avantiPanel">
            <!-- Header -->
            <div class="avanti-header">
                <div class="avanti-header-left">
                    <div class="avanti-header-avatar">
                        <img src="./logo.png" class="avanti-logo-img" alt="Avanti" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=font-size:24px>💬</span><span class=online-indicator></span>';">
                        <span class="online-indicator"></span>
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
                <div class="avanti-view avanti-welcome-view active" id="welcomeView">
                    <!-- Hero Card -->
                    <div class="avanti-hero-card">
                        <div class="avanti-hero-emoji">👋</div>
                        <div class="avanti-hero-title" id="heroTitle">HELLO</div>
                        <div class="avanti-hero-text" id="heroText">How can we help you?</div>
                        
                        <!-- Search Box -->
                        <div class="avanti-search-box" onclick="AvantiWidget.showChat()">
                            <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                            <span>Search in FAQs...</span>
                        </div>
                    </div>
                    
                    <!-- Help Text -->
                    <div class="avanti-help-text">
                        We're here to help you get instant answers.
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="avanti-section-title">Quick Help</div>
                    <div class="avanti-quick-cards">
                        <button class="avanti-quick-card" onclick="AvantiWidget.searchTopic('login')">
                            <div class="avanti-quick-card-icon login">🔐</div>
                            <div class="avanti-quick-card-content">
                                <div class="avanti-quick-card-title">Login Issues</div>
                                <div class="avanti-quick-card-desc">Password, OTP problems</div>
                            </div>
                            <span class="avanti-quick-card-arrow">›</span>
                        </button>
                        
                        <button class="avanti-quick-card" onclick="AvantiWidget.searchTopic('attendance')">
                            <div class="avanti-quick-card-icon attendance">📅</div>
                            <div class="avanti-quick-card-content">
                                <div class="avanti-quick-card-title">Attendance Help</div>
                                <div class="avanti-quick-card-desc">Mark, view attendance</div>
                            </div>
                            <span class="avanti-quick-card-arrow">›</span>
                        </button>
                        
                        <button class="avanti-quick-card" onclick="AvantiWidget.searchTopic('curriculum')">
                            <div class="avanti-quick-card-icon curriculum">📚</div>
                            <div class="avanti-quick-card-content">
                                <div class="avanti-quick-card-title">Curriculum & Progress</div>
                                <div class="avanti-quick-card-desc">Syllabus, chapters</div>
                            </div>
                            <span class="avanti-quick-card-arrow">›</span>
                        </button>
                        
                        <button class="avanti-quick-card" onclick="AvantiWidget.showForm()">
                            <div class="avanti-quick-card-icon ticket">🎫</div>
                            <div class="avanti-quick-card-content">
                                <div class="avanti-quick-card-title">Raise a Ticket</div>
                                <div class="avanti-quick-card-desc">Get personalized support</div>
                            </div>
                            <span class="avanti-quick-card-arrow">›</span>
                        </button>
                    </div>
                    
                    <!-- View Conversations Button -->
                    <button class="avanti-conversations-btn" onclick="AvantiWidget.showTickets()">
                        <span>📨</span> View conversations
                    </button>
                </div>
                
                <!-- Chat View -->
                <div class="avanti-view avanti-chat-view" id="chatView">
                    <div class="avanti-chat-messages" id="chatMessages"></div>
                    <div class="avanti-chat-input-wrapper">
                        <input type="text" class="avanti-chat-input" id="chatInput" placeholder="Type your question..." onkeypress="if(event.key==='Enter' && !event.repeat)AvantiWidget.sendMessage()">
                        <button class="avanti-chat-send" onclick="AvantiWidget.sendMessage()">
                            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                        </button>
                    </div>
                </div>
                
                <!-- Tickets View -->
                <div class="avanti-view avanti-tickets-view" id="ticketsView">
                    <div class="avanti-tickets-header">
                        <h2>Your Tickets</h2>
                    </div>
                    <div class="avanti-tickets-list" id="ticketsList"></div>
                </div>
                
                <!-- Form View -->
                <div class="avanti-view avanti-form-view" id="formView">
                    <div class="avanti-form-scroll" id="formContent"></div>
                </div>
            </div>
            
            <!-- Bottom Navigation -->
            <div class="avanti-bottom-nav">
                <button class="avanti-nav-btn active" id="navWelcome" onclick="AvantiWidget.showWelcome()">
                    <div class="avanti-nav-icon">
                        <svg viewBox="0 0 24 24"><path d="M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg>
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
                <button class="avanti-nav-btn" id="navMinimize" onclick="AvantiWidget.close()">
                    <div class="avanti-nav-icon">
                        <svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
                    </div>
                    <span class="avanti-nav-label">Minimize</span>
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
        getGreeting: function(name) {
            const hour = new Date().getHours();
            const nameStr = name ? `, ${name}` : '';
            
            if (hour < 12) {
                return { title: 'GOOD MORNING' + nameStr.toUpperCase(), emoji: '🌅' };
            } else if (hour < 17) {
                return { title: 'GOOD AFTERNOON' + nameStr.toUpperCase(), emoji: '☀️' };
            } else {
                return { title: 'GOOD EVENING' + nameStr.toUpperCase(), emoji: '🌙' };
            }
        },
        
        // Initialize
        init: function() {
            console.log('[AvantiWidget] Starting initialization v6.0 Kommunicate Style...');
            
            // Get user from localStorage first (students)
            this.getUserFromLocalStorage();
            
            // Update welcome text
            this.updateWelcomeText();
            
            // Wait for Firebase
            this.waitForFirebase();
            
            // Show greeting popup after delay
            setTimeout(() => this.showGreeting(), 8000 + Math.random() * 2000);
            
            // Initialize notification badge
            setTimeout(() => this.updateNotificationBadge(), 500);
            
            // Ensure widget button is always visible
            this.ensureWidgetVisible();
            setInterval(() => this.ensureWidgetVisible(), 2000);
            
            console.log('[AvantiWidget] Init complete');
        },
        
        // Ensure widget button is always visible
        ensureWidgetVisible: function() {
            const fab = document.getElementById('avantiFab');
            if (fab) {
                fab.style.display = 'flex';
                fab.style.opacity = '1';
                fab.style.visibility = 'visible';
            }
        },
        
        // Wait for Firebase
        waitForFirebase: function() {
            this.initAttempts++;
            
            if (typeof firebase !== 'undefined') {
                try {
                    firebase.firestore();
                    this.firebaseReady = true;
                    console.log('[AvantiWidget] ✓ Firebase ready!');
                    
                    this.getTeacherFromFirebase();
                    this.loadFAQs();
                    setTimeout(() => this.loadTickets(), 1000);
                    setTimeout(() => this.loadUserNotifications(), 1500);
                    return;
                } catch (e) {
                    console.log('[AvantiWidget] Waiting for Firebase... attempt:', this.initAttempts);
                }
            }
            
            if (this.initAttempts < 30) {
                setTimeout(() => this.waitForFirebase(), 500);
            } else {
                console.log('[AvantiWidget] Firebase not available - running in offline mode');
            }
        },
        
        // Get user from localStorage (students)
        getUserFromLocalStorage: function() {
            const possibleKeys = ['studentSession', 'student', 'studentData', 'currentStudent', 'loggedInStudent'];
            
            for (const key of possibleKeys) {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const parsed = JSON.parse(data);
                        if (parsed && (parsed.name || parsed.studentId || parsed.id)) {
                            const studentId = parsed.studentId || parsed.id || parsed.student_id || '';
                            this.user = {
                                type: 'student',
                                name: parsed.name || parsed.studentName || parsed.student_name || '',
                                studentId: studentId ? String(studentId) : '',
                                school: parsed.school || parsed.schoolName || parsed.center || parsed.school_name || '',
                                grade: parsed.grade || parsed.class || ''
                            };
                            console.log('[AvantiWidget] ✓ Found student:', this.user.name);
                            return;
                        }
                    }
                } catch (e) {}
            }
            console.log('[AvantiWidget] No student in localStorage');
        },
        
        // Get teacher from Firebase Auth
        getTeacherFromFirebase: function() {
            if (!this.firebaseReady || this.user) return;
            
            try {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    this.setTeacherUser(currentUser);
                }
                
                firebase.auth().onAuthStateChanged(u => {
                    if (u && (!this.user || this.user.type !== 'student')) {
                        this.setTeacherUser(u);
                    }
                });
            } catch (e) {
                console.log('[AvantiWidget] Firebase auth error:', e);
            }
        },
        
        // Set teacher user data
        setTeacherUser: function(firebaseUser) {
            this.user = {
                type: 'teacher',
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
                email: firebaseUser.email || '',
                school: ''
            };
            
            console.log('[AvantiWidget] ✓ Found teacher:', this.user.email);
            
            try {
                firebase.firestore().collection('teachers')
                    .where('email', '==', firebaseUser.email)
                    .limit(1)
                    .get()
                    .then(snap => {
                        if (!snap.empty) {
                            const t = snap.docs[0].data();
                            this.user.name = t.name || this.user.name;
                            this.user.school = t.school || t.center || t.schoolName || '';
                            this.updateWelcomeText();
                        }
                    })
                    .catch(e => {});
            } catch (e) {}
            
            this.updateWelcomeText();
        },
        
        // Update welcome text
        updateWelcomeText: function() {
            const greeting = this.getGreeting(this.user?.name);
            const heroTitle = document.getElementById('heroTitle');
            const heroText = document.getElementById('heroText');
            
            if (heroTitle) {
                heroTitle.textContent = greeting.title;
            }
            if (heroText) {
                heroText.textContent = 'How can we help you?';
            }
        },
        
        // Show greeting bubble
        showGreeting: function() {
            const greetingEl = document.getElementById('avantiGreeting');
            const panel = document.getElementById('avantiPanel');
            
            if (greetingEl && !panel.classList.contains('open')) {
                greetingEl.classList.add('show');
                greetingEl.onclick = () => this.open();
                
                setTimeout(() => {
                    greetingEl.classList.remove('show');
                }, 10000);
            }
        },
        
        // Hide greeting
        hideGreeting: function() {
            document.getElementById('avantiGreeting')?.classList.remove('show');
        },
        
        // Toggle widget
        toggle: function() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },
        
        // Open widget
        open: function() {
            this.isOpen = true;
            document.getElementById('avantiPanel').classList.add('open');
            document.getElementById('avantiFab').classList.add('open');
            this.hideGreeting();
        },
        
        // Close widget
        close: function() {
            this.isOpen = false;
            document.getElementById('avantiPanel').classList.remove('open');
            document.getElementById('avantiFab').classList.remove('open');
        },
        
        // Navigation methods
        setActiveNav: function(navId) {
            document.querySelectorAll('.avanti-nav-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(navId)?.classList.add('active');
        },
        
        setActiveView: function(viewId) {
            document.querySelectorAll('.avanti-view').forEach(view => view.classList.remove('active'));
            document.getElementById(viewId)?.classList.add('active');
            this.currentView = viewId;
        },
        
        showWelcome: function() {
            this.setActiveView('welcomeView');
            this.setActiveNav('navWelcome');
        },
        
        showChat: function() {
            this.setActiveView('chatView');
            this.setActiveNav('navConversations');
            
            const messages = document.getElementById('chatMessages');
            if (!messages.innerHTML.trim()) {
                messages.innerHTML = `
                    <div class="avanti-message bot">
                        <div class="avanti-message-bubble">
                            Hello! 👋 How can I help you today? You can search for help or type your question below.
                        </div>
                    </div>
                `;
            }
            
            setTimeout(() => {
                document.getElementById('chatInput')?.focus();
            }, 100);
        },
        
        showFAQs: function() {
            this.showChat();
            this.setActiveNav('navFaqs');
            
            const messages = document.getElementById('chatMessages');
            messages.innerHTML = `
                <div class="avanti-message bot">
                    <div class="avanti-message-bubble">
                        Here are the most common questions. Click any to see the answer!
                    </div>
                </div>
            `;
            
            if (this.faqs.length > 0) {
                this.faqs.slice(0, 8).forEach(faq => {
                    messages.innerHTML += `
                        <div class="avanti-faq-card" onclick="AvantiWidget.showFAQAnswer('${faq.id}')">
                            <h4>${faq.question}</h4>
                            <div class="category">${faq.category || 'General'}</div>
                        </div>
                    `;
                });
            } else {
                messages.innerHTML += `
                    <div class="avanti-message bot">
                        <div class="avanti-message-bubble">
                            No FAQs available yet. Please raise a ticket for help!
                        </div>
                    </div>
                `;
            }
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
            if (!this.firebaseReady) return;
            
            firebase.firestore().collection('helpdesk_faqs')
                .orderBy('order', 'asc')
                .limit(20)
                .get()
                .then(snap => {
                    this.faqs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log('[AvantiWidget] ✓ Loaded', this.faqs.length, 'FAQs');
                })
                .catch(e => console.log('[AvantiWidget] FAQ load error:', e));
        },
        
        // Search topic
        searchTopic: function(topic) {
            this.showChat();
            
            const messages = document.getElementById('chatMessages');
            messages.innerHTML = `
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
                    messages.innerHTML += `
                        <div class="avanti-faq-card" onclick="AvantiWidget.showFAQAnswer('${faq.id}')">
                            <h4>${faq.question}</h4>
                            <div class="category">${faq.category || 'General'}</div>
                        </div>
                    `;
                });
            } else {
                messages.innerHTML += `
                    <div class="avanti-message bot">
                        <div class="avanti-message-bubble">
                            No specific FAQs found. Would you like to raise a ticket?
                        </div>
                    </div>
                    <button class="avanti-btn-primary" style="margin: 8px 0; max-width: 85%;" onclick="AvantiWidget.showForm()">🎫 Raise a Ticket</button>
                `;
            }
            
            messages.scrollTop = messages.scrollHeight;
        },
        
        // Show FAQ answer
        showFAQAnswer: function(faqId) {
            const faq = this.faqs.find(f => f.id === faqId);
            if (!faq) return;
            
            const messages = document.getElementById('chatMessages');
            messages.innerHTML += `
                <div class="avanti-message user">
                    <div class="avanti-message-bubble">${faq.question}</div>
                </div>
                <div class="avanti-message bot">
                    <div class="avanti-message-bubble">${faq.answer}</div>
                </div>
            `;
            
            messages.scrollTop = messages.scrollHeight;
        },
        
        // Send message
        sendMessage: function() {
            const input = document.getElementById('chatInput');
            const query = input.value.trim();
            if (!query) return;
            
            const messages = document.getElementById('chatMessages');
            
            // Add user message
            messages.innerHTML += `
                <div class="avanti-message user">
                    <div class="avanti-message-bubble">${this.escapeHtml(query)}</div>
                </div>
            `;
            
            input.value = '';
            messages.scrollTop = messages.scrollHeight;
            
            // Show typing indicator
            messages.innerHTML += `
                <div class="avanti-typing" id="typing">
                    <div class="avanti-typing-dot"></div>
                    <div class="avanti-typing-dot"></div>
                    <div class="avanti-typing-dot"></div>
                </div>
            `;
            messages.scrollTop = messages.scrollHeight;
            
            // Process message
            setTimeout(() => {
                document.getElementById('typing')?.remove();
                this.processQuery(query);
            }, 800);
        },
        
        // Process query
        processQuery: function(query) {
            const q = query.toLowerCase().trim();
            const messages = document.getElementById('chatMessages');
            
            // Greeting
            if (/^(hi|hello|hey|namaste)$/i.test(q)) {
                messages.innerHTML += `
                    <div class="avanti-message bot">
                        <div class="avanti-message-bubble">
                            Namaste! 🙏 How can I help you today?
                        </div>
                    </div>
                `;
                messages.scrollTop = messages.scrollHeight;
                return;
            }
            
            // Thank you
            if (q.includes('thank')) {
                messages.innerHTML += `
                    <div class="avanti-message bot">
                        <div class="avanti-message-bubble">
                            You're welcome! 😊 Happy to help. Let me know if you need anything else.
                        </div>
                    </div>
                `;
                messages.scrollTop = messages.scrollHeight;
                return;
            }
            
            // Search FAQs
            const words = q.split(/\s+/).filter(w => w.length > 2);
            const results = this.faqs.filter(f => {
                const text = `${f.question} ${f.answer}`.toLowerCase();
                return words.filter(w => text.includes(w)).length >= 1;
            }).slice(0, 3);
            
            if (results.length > 0) {
                messages.innerHTML += `
                    <div class="avanti-message bot">
                        <div class="avanti-message-bubble">
                            Here's what I found:
                        </div>
                    </div>
                `;
                
                results.forEach(faq => {
                    messages.innerHTML += `
                        <div class="avanti-faq-card" onclick="AvantiWidget.showFAQAnswer('${faq.id}')">
                            <h4>${faq.question}</h4>
                            <div class="category">${faq.category || 'General'}</div>
                        </div>
                    `;
                });
            } else {
                messages.innerHTML += `
                    <div class="avanti-message bot">
                        <div class="avanti-message-bubble">
                            I couldn't find a specific answer for that. Would you like to raise a support ticket for personalized help?
                        </div>
                    </div>
                    <button class="avanti-btn-primary" style="margin: 8px 0; max-width: 85%;" onclick="AvantiWidget.showForm()">🎫 Raise a Ticket</button>
                `;
            }
            
            messages.scrollTop = messages.scrollHeight;
        },
        
        // Escape HTML
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        // Load tickets
        loadTickets: function() {
            if (!this.firebaseReady) {
                this.renderTicketsList([]);
                return;
            }
            
            const list = document.getElementById('ticketsList');
            list.innerHTML = '<div class="avanti-empty-state"><div class="icon">⏳</div><p>Loading tickets...</p></div>';
            
            let query = firebase.firestore().collection('helpdesk_tickets')
                .orderBy('createdAt', 'desc')
                .limit(20);
            
            // Filter by user
            if (this.user) {
                if (this.user.type === 'student' && this.user.studentId) {
                    query = query.where('studentId', '==', String(this.user.studentId));
                } else if (this.user.type === 'teacher' && this.user.email) {
                    query = query.where('userEmail', '==', this.user.email);
                }
            }
            
            query.get()
                .then(snap => {
                    this.tickets = snap.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
                    this.renderTicketsList(this.tickets);
                    this.updateTicketsBadge();
                })
                .catch(e => {
                    console.log('[AvantiWidget] Ticket load error:', e);
                    list.innerHTML = '<div class="avanti-empty-state"><div class="icon">😕</div><p>Could not load tickets</p></div>';
                });
        },
        
        // Render tickets list
        renderTicketsList: function(tickets) {
            const list = document.getElementById('ticketsList');
            
            if (!tickets || tickets.length === 0) {
                list.innerHTML = `
                    <div class="avanti-empty-state">
                        <div class="icon">🎫</div>
                        <p>No tickets yet. Raise one if you need help!</p>
                    </div>
                    <button class="avanti-btn-primary" style="margin: 20px 16px; width: calc(100% - 32px);" onclick="AvantiWidget.showForm()">🎫 Raise a Ticket</button>
                `;
                return;
            }
            
            list.innerHTML = tickets.map(t => `
                <div class="avanti-ticket-card" onclick="AvantiWidget.viewTicket('${t.docId}')">
                    <div class="avanti-ticket-icon">🎫</div>
                    <div class="avanti-ticket-content">
                        <div class="avanti-ticket-header">
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
        
        // Update tickets badge
        updateTicketsBadge: function() {
            const openCount = this.tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
            const badge = document.getElementById('ticketsBadge');
            
            if (badge) {
                if (openCount > 0) {
                    badge.textContent = openCount;
                    badge.classList.add('show');
                } else {
                    badge.classList.remove('show');
                }
            }
        },
        
        // Format date
        formatDate: function(timestamp) {
            if (!timestamp) return '';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diff = Math.floor((now - date) / 1000);
            
            if (diff < 60) return 'Just now';
            if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
            if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
            if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
            
            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        },
        
        // View ticket
        viewTicket: function(docId) {
            const ticket = this.tickets.find(t => t.docId === docId);
            if (!ticket) return;
            
            const formContent = document.getElementById('formContent');
            this.setActiveView('formView');
            
            let repliesHtml = '';
            if (ticket.replies && ticket.replies.length > 0) {
                repliesHtml = ticket.replies.map(r => `
                    <div class="avanti-message ${r.isAdmin ? 'bot' : 'user'}">
                        <div class="avanti-message-bubble">
                            ${r.message}
                            <div style="font-size: 11px; opacity: 0.7; margin-top: 6px;">
                                ${r.isAdmin ? 'Support Team' : 'You'} • ${this.formatDate(r.timestamp)}
                            </div>
                        </div>
                    </div>
                `).join('');
            }
            
            formContent.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <button class="avanti-btn-secondary" onclick="AvantiWidget.showTickets()" style="width: auto; padding: 10px 16px;">
                        ← Back to Tickets
                    </button>
                </div>
                
                <div class="avanti-ticket-header" style="padding: 0; border: none; margin-bottom: 20px;">
                    <div class="avanti-ticket-header" style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
                        <span class="avanti-ticket-id" style="font-size: 16px;">#${ticket.ticketId || docId.substring(0, 8)}</span>
                        <span class="avanti-ticket-status ${ticket.status}">${ticket.status}</span>
                    </div>
                    <h2 style="font-size: 18px; font-weight: 700; color: var(--avanti-text);">${ticket.subject || 'No subject'}</h2>
                    <p style="font-size: 13px; color: var(--avanti-text-muted); margin-top: 4px;">
                        Created ${this.formatDate(ticket.createdAt)}
                    </p>
                </div>
                
                <div style="background: var(--avanti-bg-soft); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                    <p style="font-size: 14px; color: var(--avanti-text); line-height: 1.6;">
                        ${ticket.description || 'No description'}
                    </p>
                </div>
                
                ${ticket.screenshotUrl ? `
                    <div style="margin-bottom: 20px;">
                        <img src="${ticket.screenshotUrl}" style="width: 100%; border-radius: 12px; border: 1px solid var(--avanti-border);" alt="Screenshot">
                    </div>
                ` : ''}
                
                ${repliesHtml ? `
                    <div style="margin-bottom: 20px;">
                        <h3 style="font-size: 14px; font-weight: 600; color: var(--avanti-text); margin-bottom: 12px;">Conversation</h3>
                        ${repliesHtml}
                    </div>
                ` : ''}
                
                ${ticket.status !== 'resolved' ? `
                    <div class="avanti-form-group">
                        <label class="avanti-form-label">Add Reply</label>
                        <textarea class="avanti-form-textarea" id="ticketReply" placeholder="Type your reply..."></textarea>
                    </div>
                    <button class="avanti-btn-primary" onclick="AvantiWidget.sendTicketReply('${docId}')">
                        Send Reply
                    </button>
                ` : `
                    <div style="text-align: center; padding: 20px; background: #D1FAE5; border-radius: 12px;">
                        <span style="font-size: 24px;">✅</span>
                        <p style="color: #065F46; font-weight: 600; margin-top: 8px;">This ticket has been resolved</p>
                    </div>
                `}
            `;
        },
        
        // Send ticket reply
        sendTicketReply: async function(docId) {
            const replyInput = document.getElementById('ticketReply');
            const reply = replyInput?.value.trim();
            
            if (!reply) {
                alert('Please enter a reply');
                return;
            }
            
            try {
                await firebase.firestore().collection('helpdesk_tickets').doc(docId).update({
                    replies: firebase.firestore.FieldValue.arrayUnion({
                        message: reply,
                        isAdmin: false,
                        userName: this.user?.name || 'User',
                        timestamp: new Date().toISOString()
                    }),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                this.loadTickets();
                this.viewTicket(docId);
            } catch (e) {
                console.error(e);
                alert('Failed to send reply');
            }
        },
        
        // Render form
        renderForm: function() {
            const formContent = document.getElementById('formContent');
            
            let userInfoHtml = '';
            if (this.user) {
                userInfoHtml = `
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
            
            formContent.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <button class="avanti-btn-secondary" onclick="AvantiWidget.showWelcome()" style="width: auto; padding: 10px 16px;">
                        ← Back
                    </button>
                </div>
                
                <h2 style="font-size: 20px; font-weight: 700; color: var(--avanti-text); margin-bottom: 20px;">
                    🎫 Raise a Ticket
                </h2>
                
                ${userInfoHtml}
                
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
                        <input type="email" class="avanti-form-input" id="formEmail" placeholder="Enter your email">
                    </div>
                    
                    <div class="avanti-form-group">
                        <label class="avanti-form-label">School *</label>
                        <input type="text" class="avanti-form-input" id="formSchool" placeholder="Enter your school name">
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
                    <input type="text" class="avanti-form-input" id="formSubject" placeholder="Brief description of the issue">
                </div>
                
                <div class="avanti-form-group">
                    <label class="avanti-form-label">Description *</label>
                    <textarea class="avanti-form-textarea" id="formDesc" placeholder="Please describe your issue in detail..."></textarea>
                </div>
                
                <div class="avanti-screenshot-area">
                    <label class="avanti-form-label">Screenshot (optional)</label>
                    <div class="avanti-screenshot-dropzone" onclick="document.getElementById('screenshotInput').click()">
                        <div class="icon">📷</div>
                        <p>Click to upload a screenshot</p>
                    </div>
                    <input type="file" id="screenshotInput" accept="image/*" style="display: none;" onchange="AvantiWidget.handleScreenshot(this)">
                    
                    <div class="avanti-screenshot-preview" id="screenshotPreview">
                        <img id="screenshotImg" src="">
                        <button class="avanti-screenshot-remove" onclick="AvantiWidget.removeScreenshot()">×</button>
                    </div>
                    
                    <div class="avanti-upload-progress" id="uploadProgress">
                        <div class="avanti-progress-bar">
                            <div class="avanti-progress-fill" id="progressFill"></div>
                        </div>
                        <div class="avanti-progress-text" id="progressText">Processing...</div>
                    </div>
                </div>
                
                <button class="avanti-submit-btn" id="formSubmitBtn" onclick="AvantiWidget.${this.user ? 'submitTicket' : 'submitTicketManual'}()">
                    🎫 Submit Ticket
                </button>
            `;
        },
        
        // Handle screenshot upload
        handleScreenshot: function(input) {
            const file = input.files[0];
            if (!file) return;
            
            // Validate
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be less than 5MB');
                return;
            }
            
            this.isUploadingScreenshot = true;
            
            const progressEl = document.getElementById('uploadProgress');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            
            progressEl.style.display = 'block';
            progressFill.style.width = '0%';
            progressText.textContent = 'Processing...';
            
            // Compress and preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    progressFill.style.width = '50%';
                    progressText.textContent = 'Compressing...';
                    
                    const canvas = document.createElement('canvas');
                    const maxSize = 1200;
                    let { width, height } = img;
                    
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = (height / width) * maxSize;
                            width = maxSize;
                        } else {
                            width = (width / height) * maxSize;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(blob => {
                        this.screenshotFile = new File([blob], 'screenshot.jpg', { type: 'image/jpeg' });
                        this.screenshotDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                        
                        document.getElementById('screenshotImg').src = this.screenshotDataUrl;
                        document.getElementById('screenshotPreview').style.display = 'block';
                        
                        progressFill.style.width = '100%';
                        progressText.textContent = '✓ Ready!';
                        
                        setTimeout(() => {
                            progressEl.style.display = 'none';
                            this.isUploadingScreenshot = false;
                        }, 500);
                    }, 'image/jpeg', 0.85);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },
        
        // Remove screenshot
        removeScreenshot: function() {
            this.screenshotFile = null;
            this.screenshotDataUrl = null;
            document.getElementById('screenshotPreview').style.display = 'none';
            document.getElementById('screenshotInput').value = '';
            document.getElementById('uploadProgress').style.display = 'none';
        },
        
        // Upload screenshot to Firebase
        uploadScreenshot: async function(ticketId) {
            if (!this.screenshotFile) return null;
            
            if (!this.firebaseReady) {
                return this.screenshotDataUrl || null;
            }
            
            try {
                const storageRef = firebase.storage().ref();
                const safeTicketId = String(ticketId).replace(/[^a-zA-Z0-9]/g, '_');
                const fileRef = storageRef.child(`helpdesk_screenshots/${safeTicketId}_${Date.now()}.jpg`);
                
                const uploadTask = fileRef.put(this.screenshotFile);
                
                return new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        null,
                        reject,
                        async () => {
                            const url = await fileRef.getDownloadURL();
                            resolve(url);
                        }
                    );
                });
            } catch (e) {
                console.error('[AvantiWidget] Screenshot upload error:', e);
                return this.screenshotDataUrl || null;
            }
        },
        
        // Submit ticket (logged in user)
        submitTicket: async function() {
            if (this.isUploadingScreenshot) {
                alert('Please wait for screenshot to finish processing...');
                return;
            }
            
            if (!this.firebaseReady) {
                alert('Please wait, connecting to server...');
                return;
            }
            
            const btn = document.getElementById('formSubmitBtn');
            const subject = document.getElementById('formSubject').value.trim();
            const desc = document.getElementById('formDesc').value.trim();
            const category = document.getElementById('formCategory').value;
            
            if (!subject || !desc) {
                alert('Please fill in all required fields');
                return;
            }
            
            btn.disabled = true;
            btn.innerHTML = '<span class="avanti-spinner"></span> Submitting...';
            
            try {
                const ticketId = 'AV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
                
                let screenshotUrl = null;
                if (this.screenshotFile) {
                    btn.innerHTML = '<span class="avanti-spinner"></span> Uploading screenshot...';
                    screenshotUrl = await this.uploadScreenshot(ticketId);
                }
                
                await firebase.firestore().collection('helpdesk_tickets').add({
                    ticketId,
                    userName: this.user.name,
                    userEmail: this.user.email || '',
                    studentId: this.user.studentId ? String(this.user.studentId) : null,
                    school: this.user.school,
                    userRole: this.user.type === 'student' ? 'Student' : 'Teacher',
                    userGrade: this.user.grade || null,
                    category,
                    subject,
                    description: desc,
                    screenshotUrl,
                    status: 'open',
                    priority: 'medium',
                    replies: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                this.loadTickets();
                this.showSuccess(ticketId);
            } catch (err) {
                console.error(err);
                alert('Failed to submit. Please try again.');
                btn.disabled = false;
                btn.innerHTML = '🎫 Submit Ticket';
            }
        },
        
        // Submit ticket (manual entry)
        submitTicketManual: async function() {
            if (this.isUploadingScreenshot) {
                alert('Please wait for screenshot to finish processing...');
                return;
            }
            
            if (!this.firebaseReady) {
                alert('Please wait, connecting to server...');
                return;
            }
            
            const btn = document.getElementById('formSubmitBtn');
            const name = document.getElementById('formName').value.trim();
            const studentId = document.getElementById('formStudentId').value.trim();
            const email = document.getElementById('formEmail').value.trim();
            const school = document.getElementById('formSchool').value.trim();
            const subject = document.getElementById('formSubject').value.trim();
            const desc = document.getElementById('formDesc').value.trim();
            const category = document.getElementById('formCategory').value;
            
            if (!name || !school || !subject || !desc) {
                alert('Please fill in all required fields');
                return;
            }
            
            btn.disabled = true;
            btn.innerHTML = '<span class="avanti-spinner"></span> Submitting...';
            
            try {
                const ticketId = 'AV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
                
                let screenshotUrl = null;
                if (this.screenshotFile) {
                    btn.innerHTML = '<span class="avanti-spinner"></span> Uploading screenshot...';
                    screenshotUrl = await this.uploadScreenshot(ticketId);
                }
                
                await firebase.firestore().collection('helpdesk_tickets').add({
                    ticketId,
                    userName: name,
                    userEmail: email || '',
                    studentId: studentId || null,
                    school,
                    userRole: studentId ? 'Student' : (email ? 'Teacher' : 'Unknown'),
                    category,
                    subject,
                    description: desc,
                    screenshotUrl,
                    status: 'open',
                    priority: 'medium',
                    replies: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                this.showSuccess(ticketId);
            } catch (err) {
                console.error(err);
                alert('Failed to submit. Please try again.');
                btn.disabled = false;
                btn.innerHTML = '🎫 Submit Ticket';
            }
        },
        
        // Show success screen
        showSuccess: function(ticketId) {
            const formContent = document.getElementById('formContent');
            formContent.innerHTML = `
                <div class="avanti-success-screen">
                    <div class="icon">✅</div>
                    <h3>Ticket Submitted!</h3>
                    <div class="ticket-id">${ticketId}</div>
                    <p>We've received your ticket and will get back to you soon. You'll be notified when there's an update.</p>
                    <button class="avanti-btn-primary" onclick="AvantiWidget.showTickets()">
                        View My Tickets
                    </button>
                    <button class="avanti-btn-secondary" onclick="AvantiWidget.showWelcome()">
                        Back to Home
                    </button>
                </div>
            `;
        },
        
        // Update notification badge
        updateNotificationBadge: function() {
            const badge = document.getElementById('fabBadge');
            if (badge && this.unreadNotifications > 0) {
                badge.textContent = this.unreadNotifications;
                badge.classList.add('show');
            } else if (badge) {
                badge.classList.remove('show');
            }
        },
        
        // Load user notifications
        loadUserNotifications: function() {
            // Placeholder - notifications system
            console.log('[AvantiWidget] Notifications loaded');
        },
        
        // Show toast
        showToast: function(message, duration = 4000) {
            let toast = document.querySelector('.avanti-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.className = 'avanti-toast';
                document.body.appendChild(toast);
            }
            
            toast.textContent = message;
            toast.classList.add('show');
            
            setTimeout(() => toast.classList.remove('show'), duration);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AvantiWidget.init());
    } else {
        AvantiWidget.init();
    }
})();
