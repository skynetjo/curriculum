/**
 * ============================================
 * AVANTI HELP DESK WIDGET v5.1
 * ============================================
 * 
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
    fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // ============================================
    // INJECT CSS STYLES
    // ============================================
    const styleEl = document.createElement('style');
    styleEl.id = 'avanti-widget-styles';
    styleEl.textContent = `
/* ============================================
   AVANTI WIDGET STYLES v4.0
   ============================================ */

/* Greeting Popup */
.avanti-greeting-popup {
    position: fixed;
    bottom: 100px;
    right: 30px;
    background: linear-gradient(135deg, #12121a, #1a1a24);
    border: 1px solid #2a2a3a;
    border-radius: 16px;
    padding: 16px 20px;
    max-width: 280px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    z-index: 99980;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px) translateZ(0);
    transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    will-change: opacity, transform;
}

.avanti-greeting-popup.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) translateZ(0);
}

.avanti-greeting-popup .greeting-text {
    color: #fff;
    font-size: 14px;
    line-height: 1.5;
}

.avanti-greeting-popup .greeting-close {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    color: #5a5a6a;
    cursor: pointer;
    font-size: 18px;
    padding: 4px;
    line-height: 1;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avanti-greeting-popup .greeting-close:hover {
    color: #fff;
    background: rgba(255,255,255,0.1);
}

/* Help Button - YELLOW GRADIENT */
.avanti-help-btn {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #F4B41A, #E8A830);
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(244, 180, 26, 0.4);
    z-index: 99990;
    transition: transform 0.3s ease, box-shadow 0.3s ease, bottom 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    will-change: transform;
}

/* Position chatbot button above bottom nav on mobile */
@media (max-width: 768px) {
    .avanti-help-btn {
        bottom: 85px !important;
        right: 20px;
        width: 50px;
        height: 50px;
    }
}

.avanti-help-btn:hover {
    transform: scale(1.1) translateZ(0);
    box-shadow: 0 6px 30px rgba(244, 180, 26, 0.5);
}

.avanti-help-btn .btn-icon {
    width: 28px;
    height: 28px;
    transition: transform 0.3s ease;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
}

.avanti-help-btn .btn-icon svg {
    width: 100%;
    height: 100%;
    fill: #0a0a0f;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
}

.avanti-help-btn.open .btn-icon svg.chat-icon {
    display: none;
}

.avanti-help-btn.open .btn-icon svg.close-icon {
    display: block;
}

.avanti-help-btn .btn-icon svg.close-icon {
    display: none;
}

/* PWA Notification Badge */
.avanti-help-btn .notification-dot {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 18px;
    height: 18px;
    background: #ef4444;
    border-radius: 50%;
    border: 3px solid #0a0a0f;
    display: none;
    animation: pulseBadge 2s infinite;
}

.avanti-help-btn .notification-dot.show {
    display: block;
}

@keyframes pulseBadge {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

/* Widget Panel */
.avanti-widget-panel {
    position: fixed;
    bottom: 100px;
    right: 30px;
    width: 380px;
    height: 520px;
    background: #12121a;
    border-radius: 20px;
    box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
    z-index: 99998;
    display: flex;
    flex-direction: column;
    border: 1px solid #2a2a3a;
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px) scale(0.95);
    transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
    overflow: hidden;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    -webkit-transform-style: preserve-3d;
    transform-style: preserve-3d;
    will-change: opacity, transform;
}

.avanti-widget-panel.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1) translateZ(0);
}

/* Header */
.avanti-widget-header {
    background: linear-gradient(135deg, #F4B41A, #E8A830);
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 70px;
}

.avanti-widget-header-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.avanti-widget-header .logo {
    width: 42px;
    height: 42px;
    background: rgba(0,0,0,0.15);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
}

.avanti-widget-header h3 {
    color: #0a0a0f;
    font-size: 17px;
    font-weight: 700;
    margin: 0;
}

.avanti-widget-header p {
    color: rgba(0,0,0,0.6);
    font-size: 12px;
    margin: 2px 0 0 0;
}

/* FIXED: Close button - better styling for mobile */
.avanti-widget-header .close-btn {
    background: rgba(0,0,0,0.15);
    border: none;
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: bold;
    color: #0a0a0f;
    transition: all 0.2s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
}

.avanti-widget-header .close-btn:hover,
.avanti-widget-header .close-btn:active {
    background: rgba(0,0,0,0.25);
    transform: scale(1.05);
}

/* Body */
.avanti-widget-body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

/* Home View */
.avanti-home-view {
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.avanti-welcome {
    margin-bottom: 24px;
}

.avanti-welcome h2 {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 4px 0;
    line-height: 1.3;
}

.avanti-welcome p {
    color: #8a8a9a;
    font-size: 15px;
    margin: 0;
}

/* Search Box */
.avanti-search-box {
    background: #1a1a24;
    border: 1px solid #2a2a3a;
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 20px;
}

.avanti-search-box:hover {
    border-color: #F4B41A;
}

.avanti-search-box span {
    color: #5a5a6a;
    font-size: 15px;
}

.avanti-search-box .arrow {
    margin-left: auto;
    color: #F4B41A;
    font-size: 18px;
}

/* Quick Actions */
.avanti-quick-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
}

.avanti-quick-action {
    background: #1a1a24;
    border: 1px solid #2a2a3a;
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    color: #fff;
    font-size: 14px;
    font-family: inherit;
}

.avanti-quick-action:hover {
    border-color: #F4B41A;
    transform: translateX(4px);
}

.avanti-quick-action .icon {
    font-size: 18px;
}

.avanti-quick-action .arrow {
    margin-left: auto;
    color: #5a5a6a;
}

/* Bottom Navigation */
.avanti-bottom-nav {
    display: flex;
    border-top: 1px solid #2a2a3a;
    background: #0a0a0f;
    padding: 8px 0;
}

.avanti-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px;
    cursor: pointer;
    color: #5a5a6a;
    font-size: 11px;
    background: none;
    border: none;
    transition: all 0.2s;
    font-family: inherit;
    position: relative;
}

.avanti-nav-item:hover,
.avanti-nav-item.active {
    color: #F4B41A;
}

.avanti-nav-item .nav-icon {
    font-size: 20px;
}

.avanti-nav-item .nav-badge {
    position: absolute;
    top: 6px;
    right: calc(50% - 18px);
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    display: none;
}

.avanti-nav-item .nav-badge.show {
    display: block;
}

/* Chat View */
.avanti-chat-view {
    display: none;
    flex-direction: column;
    height: 100%;
}

.avanti-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.avanti-chat-input {
    padding: 12px 16px;
    border-top: 1px solid #2a2a3a;
    display: flex;
    gap: 10px;
    background: #0a0a0f;
}

.avanti-chat-input input {
    flex: 1;
    background: #1a1a24;
    border: 1px solid #2a2a3a;
    border-radius: 24px;
    padding: 12px 18px;
    color: #fff;
    font-size: 14px;
    font-family: inherit;
}

.avanti-chat-input input:focus {
    outline: none;
    border-color: #F4B41A;
}

.avanti-chat-input input::placeholder {
    color: #5a5a6a;
}

.avanti-chat-input button {
    background: linear-gradient(135deg, #F4B41A, #E8A830);
    border: none;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #0a0a0f;
    transition: all 0.2s;
}

.avanti-chat-input button:hover {
    transform: scale(1.05);
}

/* Messages */
.avanti-msg {
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.5;
    max-width: 85%;
    animation: msgSlide 0.3s ease;
}

@keyframes msgSlide {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.avanti-msg.bot {
    background: #1a1a24;
    color: #fff;
    align-self: flex-start;
    border: 1px solid #2a2a3a;
}

.avanti-msg.user {
    background: linear-gradient(135deg, #F4B41A, #E8A830);
    color: #0a0a0f;
    align-self: flex-end;
}

/* FAQ Results */
.avanti-faq-card {
    background: #1a1a24;
    border: 1px solid #2a2a3a;
    border-radius: 12px;
    padding: 14px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 8px;
}

.avanti-faq-card:hover {
    border-color: #F4B41A;
}

.avanti-faq-card h4 {
    color: #fff;
    font-size: 14px;
    margin: 0;
    line-height: 1.4;
}

.avanti-faq-card .category {
    font-size: 11px;
    color: #F4B41A;
    text-transform: uppercase;
    margin-top: 6px;
}

/* FAQ Answer */
.avanti-faq-answer {
    background: #1a1a24;
    border: 1px solid #2a2a3a;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
}

.avanti-faq-answer h4 {
    color: #F4B41A;
    font-size: 14px;
    margin: 0 0 10px 0;
}

.avanti-faq-answer p {
    color: #d1d1d1;
    font-size: 13px;
    line-height: 1.6;
    margin: 0;
}

/* Feedback Buttons */
.avanti-feedback-btns {
    display: flex;
    gap: 10px;
    margin-top: 10px;
}

.avanti-feedback-btn {
    flex: 1;
    padding: 10px;
    border: 1px solid #2a2a3a;
    background: #1a1a24;
    border-radius: 8px;
    cursor: pointer;
    color: #fff;
    font-size: 13px;
    transition: all 0.2s;
    font-family: inherit;
}

.avanti-feedback-btn:hover {
    border-color: #F4B41A;
}

.avanti-feedback-btn.yes:hover {
    background: rgba(16, 185, 129, 0.2);
    border-color: #10b981;
}

.avanti-feedback-btn.no:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: #ef4444;
}

/* Tickets View */
.avanti-tickets-view {
    display: none;
    flex-direction: column;
    height: 100%;
}

.avanti-tickets-header {
    padding: 16px 20px;
    border-bottom: 1px solid #2a2a3a;
}

.avanti-tickets-header h3 {
    color: #fff;
    font-size: 18px;
    margin: 0;
}

.avanti-tickets-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
}

/* Ticket Card */
.avanti-ticket-card {
    background: #1a1a24;
    border: 1px solid #2a2a3a;
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.avanti-ticket-card:hover {
    border-color: #F4B41A;
}

.avanti-ticket-card .ticket-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.avanti-ticket-card .ticket-id {
    font-family: 'Space Mono', monospace;
    color: #F4B41A;
    font-size: 13px;
}

.avanti-ticket-card .status {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 20px;
    text-transform: capitalize;
}

.avanti-ticket-card .status.open {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
}

.avanti-ticket-card .status.in-progress {
    background: rgba(234, 179, 8, 0.2);
    color: #eab308;
}

.avanti-ticket-card .status.resolved {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
}

.avanti-ticket-card .status.closed {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
}

.avanti-ticket-card .status.pending {
    background: rgba(168, 85, 247, 0.2);
    color: #a855f7;
}

.avanti-ticket-card .subject {
    color: #fff;
    font-size: 14px;
    margin-bottom: 6px;
}

.avanti-ticket-card .meta {
    color: #5a5a6a;
    font-size: 12px;
}

/* Form View */
.avanti-form-view {
    display: none;
    flex-direction: column;
    height: 100%;
}

.avanti-form-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
}

/* Action Buttons */
.avanti-action-btns {
    display: flex;
    gap: 10px;
    margin-top: 16px;
}

.avanti-action-btn {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    border: none;
}

.avanti-action-btn.primary {
    background: linear-gradient(135deg, #F4B41A, #E8A830);
    color: #0a0a0f;
}

.avanti-action-btn.secondary {
    background: #1a1a24;
    border: 1px solid #2a2a3a;
    color: #fff;
}

.avanti-action-btn:hover {
    transform: translateY(-2px);
}

/* User Info Display */
.avanti-user-info {
    background: #1a1a24;
    border: 1px solid #2a2a3a;
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 16px;
}

.avanti-user-info .user-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    color: #10b981;
    font-size: 13px;
}

.avanti-user-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid #2a2a3a;
    font-size: 13px;
}

.avanti-user-row:last-child {
    border-bottom: none;
}

.avanti-user-row span:first-child {
    color: #8a8a9a;
}

.avanti-user-row span:last-child {
    color: #fff;
}

/* Form Styles */
.avanti-form-group {
    margin-bottom: 14px;
}

.avanti-form-group label {
    display: block;
    color: #8a8a9a;
    font-size: 12px;
    margin-bottom: 6px;
}

.avanti-form-group input,
.avanti-form-group textarea,
.avanti-form-group select {
    width: 100%;
    padding: 12px 14px;
    background: #1a1a24;
    border: 1px solid #2a2a3a;
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
    font-family: inherit;
}

.avanti-form-group input:focus,
.avanti-form-group textarea:focus,
.avanti-form-group select:focus {
    outline: none;
    border-color: #F4B41A;
}

.avanti-form-group textarea {
    min-height: 100px;
    resize: vertical;
}

.avanti-form-group input:disabled {
    background: #0a0a0f;
    color: #8a8a9a;
}

.avanti-submit-btn {
    width: 100%;
    background: linear-gradient(135deg, #F4B41A, #E8A830);
    color: #0a0a0f;
    border: none;
    padding: 14px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
}

.avanti-submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(244, 180, 26, 0.3);
}

.avanti-submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
}

/* Screenshot Upload */
.avanti-screenshot-section {
    margin-bottom: 16px;
}

.avanti-screenshot-label {
    color: #8a8a9a;
    font-size: 12px;
    margin-bottom: 8px;
}

.avanti-screenshot-upload {
    background: #1a1a24;
    border: 2px dashed #2a2a3a;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
}

.avanti-screenshot-upload:hover {
    border-color: #F4B41A;
}

.avanti-screenshot-upload .upload-icon {
    font-size: 28px;
    margin-bottom: 8px;
}

.avanti-screenshot-upload .upload-text {
    color: #8a8a9a;
    font-size: 13px;
}

.avanti-screenshot-upload input[type="file"] {
    display: none;
}

.avanti-screenshot-preview {
    display: none;
    position: relative;
    margin-top: 10px;
}

.avanti-screenshot-preview img {
    width: 100%;
    border-radius: 8px;
    border: 1px solid #2a2a3a;
}

.avanti-screenshot-preview .remove-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    background: #ef4444;
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Upload Progress */
.avanti-upload-progress {
    background: #1a1a24;
    border-radius: 8px;
    padding: 12px;
    margin-top: 10px;
}

.avanti-progress-bar {
    height: 4px;
    background: #2a2a3a;
    border-radius: 2px;
    overflow: hidden;
}

.avanti-progress-fill {
    height: 100%;
    background: linear-gradient(135deg, #F4B41A, #E8A830);
    width: 0%;
    transition: width 0.3s;
}

.avanti-progress-text {
    font-size: 12px;
    color: #8a8a9a;
    margin-top: 6px;
    text-align: center;
}

/* Success View */
.avanti-success {
    text-align: center;
    padding: 40px 20px;
}

.avanti-success .icon {
    font-size: 60px;
    margin-bottom: 16px;
}

.avanti-success h3 {
    color: #10b981;
    font-size: 20px;
    margin: 0 0 8px 0;
}

.avanti-success .ticket-id {
    background: #1a1a24;
    padding: 12px 24px;
    border-radius: 10px;
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: #F4B41A;
    margin: 16px 0;
    display: inline-block;
    border: 1px solid #2a2a3a;
}

.avanti-success p {
    color: #8a8a9a;
    font-size: 14px;
    line-height: 1.5;
}

/* Empty State */
.avanti-empty {
    text-align: center;
    padding: 40px 20px;
    color: #5a5a6a;
}

.avanti-empty .icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.avanti-empty h4 {
    color: #8a8a9a;
    margin: 0 0 8px 0;
}

/* Loading */
.avanti-loading {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid rgba(0,0,0,0.2);
    border-top-color: #0a0a0f;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* MOBILE RESPONSIVE - FIXED */
@media (max-width: 480px) {
    .avanti-widget-panel {
        width: calc(100% - 20px);
        right: 10px;
        bottom: 80px;
        height: 75vh;
        max-height: 600px;
        border-radius: 16px;
    }
    
    .avanti-help-btn {
        width: 56px;
        height: 56px;
        right: 16px;
        bottom: 16px;
    }
    
    .avanti-help-btn .btn-icon {
        width: 24px;
        height: 24px;
    }
    
    .avanti-greeting-popup {
        right: 16px;
        bottom: 85px;
        max-width: calc(100% - 90px);
    }
    
    /* FIXED: Mobile close button - larger touch target */
    .avanti-widget-header {
        padding: 14px 16px;
    }
    
    .avanti-widget-header .close-btn {
        width: 48px;
        height: 48px;
        min-width: 48px;
        min-height: 48px;
        font-size: 28px;
        font-weight: bold;
        background: rgba(0,0,0,0.2);
    }
    
    .avanti-widget-header .logo {
        width: 38px;
        height: 38px;
    }
    
    .avanti-widget-header h3 {
        font-size: 15px;
    }
    
    .avanti-widget-header p {
        font-size: 11px;
    }
    
    .avanti-welcome h2 {
        font-size: 20px;
    }
    
    .avanti-home-view {
        padding: 20px 16px;
    }
}

/* Logo styling */
.replaced-logo { width: 32px; height: auto; display: inline-block; vertical-align: middle; }
`;
    document.head.appendChild(styleEl);

    // ============================================
    // INJECT HTML
    // ============================================
    const widgetContainer = document.createElement('div');
    widgetContainer.innerHTML = `
    <div class="avanti-widget-container">
        <!-- Greeting Popup -->
        <div class="avanti-greeting-popup" id="avantiGreeting" onclick="AvantiWidget.open()">
            <button class="greeting-close" onclick="event.stopPropagation(); AvantiWidget.hideGreeting()">×</button>
            <div class="greeting-text" id="greetingText">
                🙏 <strong>Namaste!</strong> Need any help with the Curriculum Tracker?
            </div>
        </div>
        
        <!-- Help Button -->
        <button class="avanti-help-btn" id="avantiBtn" onclick="AvantiWidget.toggle()">
            <span class="btn-icon">
                <svg class="chat-icon" viewBox="0 0 24 24" fill="#0a0a0f">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <svg class="close-icon" viewBox="0 0 24 24" fill="#0a0a0f">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </span>
            <span class="notification-dot" id="notifDot"></span>
        </button>
        
        <!-- Widget Panel -->
        <div class="avanti-widget-panel" id="avantiPanel">
            <!-- Header -->
            <div class="avanti-widget-header">
                <div class="avanti-widget-header-content">
                    <div class="logo">
                        <img src="./logo.png" class="replaced-logo" alt="Avanti Logo" onerror="this.style.display='none';this.parentElement.innerHTML='💬';">
                    </div>
                    <div>
                        <h3>Avanti Help Desk</h3>
                        <p>We're here to help!</p>
                    </div>
                </div>
                <button class="close-btn" onclick="AvantiWidget.close()" aria-label="Close">×</button>
            </div>
            
            <!-- Body -->
            <div class="avanti-widget-body" id="avantiBody">
                <!-- Home View -->
                <div class="avanti-home-view" id="homeView">
                    <div class="avanti-welcome">
                        <h2 id="welcomeText">🙏 Namaste! 👋</h2>
                        <p>How can we help you today?</p>
                    </div>
                    
                    <div class="avanti-search-box" onclick="AvantiWidget.showChat()">
                        <span>🔍</span>
                        <span>Search for help...</span>
                        <span class="arrow">→</span>
                    </div>
                    
                    <div class="avanti-quick-actions">
                        <button class="avanti-quick-action" onclick="AvantiWidget.searchTopic('login')">
                            <span class="icon">🔐</span>
                            <span>Login Issues</span>
                            <span class="arrow">›</span>
                        </button>
                        <button class="avanti-quick-action" onclick="AvantiWidget.searchTopic('attendance')">
                            <span class="icon">📅</span>
                            <span>Attendance Help</span>
                            <span class="arrow">›</span>
                        </button>
                        <button class="avanti-quick-action" onclick="AvantiWidget.searchTopic('curriculum')">
                            <span class="icon">📚</span>
                            <span>Curriculum & Progress</span>
                            <span class="arrow">›</span>
                        </button>
                        <button class="avanti-quick-action" onclick="AvantiWidget.showForm()">
                            <span class="icon">🎫</span>
                            <span>Raise a Support Ticket</span>
                            <span class="arrow">›</span>
                        </button>
                    </div>
                </div>
                
                <!-- Chat View -->
                <div class="avanti-chat-view" id="chatView">
                    <div class="avanti-chat-messages" id="chatMessages"></div>
                    <div class="avanti-chat-input">
                        <input type="text" id="chatInput" placeholder="Type your question..." onkeypress="if(event.key==='Enter' && !event.repeat)AvantiWidget.sendMessage()">
                        <button id="chatSendBtn" onclick="AvantiWidget.sendMessage()">➤</button>
                    </div>
                </div>
                
                <!-- Tickets View -->
                <div class="avanti-tickets-view" id="ticketsView">
                    <div class="avanti-tickets-header">
                        <h3>Your Tickets</h3>
                    </div>
                    <div class="avanti-tickets-list" id="ticketsList"></div>
                </div>
                
                <!-- Form View -->
                <div class="avanti-form-view" id="formView">
                    <div class="avanti-form-content" id="formContent"></div>
                </div>
            </div>
            
            <!-- Bottom Navigation -->
            <div class="avanti-bottom-nav">
                <button class="avanti-nav-item active" id="navHome" onclick="AvantiWidget.showHome()">
                    <span class="nav-icon">🏠</span>
                    <span>Home</span>
                </button>
                <button class="avanti-nav-item" id="navTickets" onclick="AvantiWidget.showTickets()">
                    <span class="nav-icon">🎫</span>
                    <span>Tickets</span>
                    <span class="nav-badge" id="ticketsBadge"></span>
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
    isAnimating: false,
    user: null,
    faqs: [],
    tickets: [],
    currentView: 'home',
    screenshotFile: null,
    screenshotDataUrl: null,
    firebaseReady: false,
    initAttempts: 0,
    unreadNotifications: 0,
    
    // Get time-based greeting in Hindi/Sanskrit
    getGreeting: function(name) {
        const hour = new Date().getHours();
        const nameStr = name ? ` ${name}` : '';
        
        if (hour < 12) {
            return `🙏 Namaste${nameStr}! सुप्रभातम् 🌅`;
        } else if (hour < 17) {
            return `🙏 Namaste${nameStr}! शुभमध्याह्नम् 🌇`;
        } else {
            return `🙏 Namaste${nameStr}! शुभसायंकालम् 🌃`;
        }
    },
    
    // Initialize
    init: function() {
        console.log('[AvantiWidget] Starting initialization v4.0...');
        
        // Get user from localStorage first (students)
        this.getUserFromLocalStorage();
        
        // Update welcome text with Namaste
        this.updateWelcomeText();
        
        // Wait for Firebase
        this.waitForFirebase();
        
        // Show greeting popup after delay
        setTimeout(() => this.showGreeting(), 12000 + Math.random() * 3000);
        
        // Initialize notification badge from stored notifications
        setTimeout(() => this.updateNotificationBadge(), 500);
        
        // CHATBOT VISIBILITY PROTECTION: Ensure chatbot is ALWAYS visible
        // This fixes the bug where chatbot disappears after marking all notifications as read
        this.ensureChatbotVisible();
        setInterval(() => this.ensureChatbotVisible(), 2000);
        
        console.log('[AvantiWidget] Init complete');
    },
    
    // Ensure chatbot button is always visible (fix for disappearing chatbot bug)
    ensureChatbotVisible: function() {
        const btn = document.getElementById('avantiBtn');
        if (btn) {
            btn.style.display = 'flex';
            btn.style.opacity = '1';
            btn.style.visibility = 'visible';
            btn.style.pointerEvents = 'auto';
        }
    },
    
    // Wait for Firebase to be initialized
    waitForFirebase: function() {
        this.initAttempts++;
        
        if (typeof firebase !== 'undefined') {
            try {
                const testRef = firebase.firestore();
                this.firebaseReady = true;
                console.log('[AvantiWidget] ✓ Firebase ready!');
                
                // Do Firebase-dependent init
                this.getTeacherFromFirebase();
                this.loadFAQs();
                setTimeout(() => this.loadTickets(), 1000);
                setTimeout(() => this.loadUserNotifications(), 1500);
                return;
            } catch (e) {
                console.log('[AvantiWidget] Waiting for Firebase... attempt:', this.initAttempts);
            }
        }
        
        // Retry up to 30 times (15 seconds)
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
                        console.log('[AvantiWidget] ✓ Found student:', this.user.name, '| ID:', this.user.studentId);
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
        
        // Get teacher details from Firestore
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
                        console.log('[AvantiWidget] ✓ Teacher details:', this.user.name, this.user.school);
                        this.updateWelcomeText();
                    }
                })
                .catch(e => {});
        } catch (e) {}
        
        this.updateWelcomeText();
    },
    
    // Update welcome text with NAMASTE
    updateWelcomeText: function() {
        const welcomeEl = document.getElementById('welcomeText');
        if (welcomeEl) {
            welcomeEl.textContent = this.getGreeting(this.user?.name);
        }
    },
    
    // Load FAQs
    // ✅ FIX: One-time fetch for FAQs (they rarely change) - saves ~₹1,500/month
    loadFAQs: function() {
        if (!this.firebaseReady) return;
        
        const fetchFAQs = async () => {
            try {
                const snap = await firebase.firestore().collection('helpdesk_faqs').get();
                this.faqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                console.log('[AvantiWidget] ✓ Loaded FAQs:', this.faqs.length);
            } catch (err) {
                console.log('[AvantiWidget] FAQ error:', err);
            }
        };
        
        fetchFAQs();
        // ✅ Refresh FAQs only once per hour (instead of realtime)
        this.faqInterval = setInterval(fetchFAQs, 3600000);
    },
    
    // ✅ FIX: Optimized tickets - replaces 5 realtime listeners with 1 periodic fetch
    // This saves approximately ₹6,000/month in Firebase reads!
    loadTickets: function() {
        if (!this.firebaseReady || !this.user) {
            console.log('[AvantiWidget] Cannot load tickets - Firebase:', this.firebaseReady, 'User:', !!this.user);
            return;
        }
        
        this.previousTicketStates = this.previousTicketStates || {};
        
        const processTickets = (newTickets, source) => {
            // Detect changes and notify user
            newTickets.forEach(ticket => {
                const prevState = this.previousTicketStates[ticket.id];
                if (prevState) {
                    if (prevState.status !== ticket.status) {
                        this.showTicketNotification(ticket, 'status', prevState.status, ticket.status);
                    }
                    const prevReplies = prevState.repliesCount || 0;
                    const newReplies = (ticket.replies || []).length;
                    if (newReplies > prevReplies) {
                        const latestReply = ticket.replies[newReplies - 1];
                        if (latestReply && latestReply.isAdmin) {
                            this.showTicketNotification(ticket, 'reply', null, latestReply.message);
                        }
                    }
                }
                this.previousTicketStates[ticket.id] = {
                    status: ticket.status,
                    repliesCount: (ticket.replies || []).length
                };
            });
            
            const existingIds = this.tickets.map(t => t.id);
            const uniqueNewTickets = newTickets.filter(t => !existingIds.includes(t.id));
            this.tickets = [...this.tickets, ...uniqueNewTickets];
            
            this.tickets.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return dateB - dateA;
            });
            
            console.log('[AvantiWidget] ✓ Loaded tickets from ' + source + ':', newTickets.length);
            
            const openCount = this.tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
            const badge = document.getElementById('ticketsBadge');
            if (badge) {
                badge.classList.toggle('show', openCount > 0);
            }
            
            if (this.currentView === 'tickets') {
                this.renderTickets();
            }
        };
        
        const fetchAllTickets = async () => {
            try {
                this.tickets = []; // Reset before fetching
                
                if (this.user.type === 'student' && this.user.studentId) {
                    // ✅ Single batch fetch for students (instead of 2 realtime listeners)
                    const [helpdeskSnap, supportSnap] = await Promise.all([
                        firebase.firestore().collection('helpdesk_tickets')
                            .where('studentId', '==', String(this.user.studentId))
                            .get(),
                        firebase.firestore().collection('support_tickets')
                            .where('studentId', '==', String(this.user.studentId))
                            .get()
                    ]);
                    
                    const helpdeskTickets = helpdeskSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'helpdesk' }));
                    const supportTickets = supportSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'support' }));
                    
                    processTickets([...helpdeskTickets, ...supportTickets], 'all');
                    
                } else if (this.user.email) {
                    // ✅ Single batch fetch for teachers (instead of 3 realtime listeners)
                    const [helpdeskSnap, supportSnap] = await Promise.all([
                        firebase.firestore().collection('helpdesk_tickets')
                            .where('userEmail', '==', this.user.email)
                            .get(),
                        firebase.firestore().collection('support_tickets')
                            .where('userEmail', '==', this.user.email)
                            .get()
                    ]);
                    
                    const helpdeskTickets = helpdeskSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'helpdesk' }));
                    const supportTickets = supportSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'support' }));
                    
                    processTickets([...helpdeskTickets, ...supportTickets], 'all');
                }
            } catch (e) {
                console.error('[AvantiWidget] Error fetching tickets:', e);
            }
        };
        
        // Initial fetch
        this.ticketsInitialized = false;
        fetchAllTickets().then(() => {
            this.ticketsInitialized = true;
        });
        
        // ✅ COST FIX: Refresh every 3 minutes instead of 60 seconds (saves ~₹2,000/month)
        this.ticketInterval = setInterval(fetchAllTickets, 180000);
    },
    
    // Play notification sound
    playNotificationSound: function() {
        try {
            // Create a simple beep sound using Web Audio API
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = 800; // Frequency in Hz
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
            
            console.log('[AvantiWidget] 🔔 Notification sound played');
        } catch (e) {
            console.log('[AvantiWidget] Could not play sound:', e);
        }
    },
    
    // Show ticket notification to user
    showTicketNotification: function(ticket, type, oldValue, newValue) {
        // Don't show notifications on first load
        if (!this.ticketsInitialized) {
            this.ticketsInitialized = true;
            return;
        }
        
        // Play notification sound
        this.playNotificationSound();
        
        // Create notification message
        let title, message;
        if (type === 'status') {
            title = '🎫 Ticket Status Updated';
            message = `Your ticket #${ticket.ticketId || ticket.id.slice(0,8)} is now "${newValue}"`;
        } else if (type === 'reply') {
            title = '💬 New Admin Reply';
            message = `New reply on #${ticket.ticketId || ticket.id.slice(0,8)}: "${newValue?.substring(0, 50)}${newValue?.length > 50 ? '...' : ''}"`;
        }
        
        // Show in-app notification toast
        this.showNotificationToast(title, message, ticket.id);
        
        // Also try browser notification if permitted
        this.showBrowserNotification(title, message);
        
        // Update notification center
        this.addToNotificationCenter(ticket, type, title, message);
    },
    
    // Show toast notification inside the widget
    showNotificationToast: function(title, message, ticketId) {
        // Remove existing toast if any
        const existingToast = document.getElementById('avantiNotificationToast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.id = 'avantiNotificationToast';
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #1a1a24, #12121a);
            border: 1px solid #F4B41A;
            border-radius: 12px;
            padding: 14px 18px;
            max-width: 320px;
            z-index: 10001;
            box-shadow: 0 8px 32px rgba(244,180,26,0.2);
            animation: slideInRight 0.3s ease;
            cursor: pointer;
        `;
        
        toast.innerHTML = `
            <style>
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; transform: translateX(20px); } }
            </style>
            <div style="display:flex;align-items:flex-start;gap:10px;">
                <div style="font-size:24px;">🔔</div>
                <div style="flex:1;">
                    <div style="color:#F4B41A;font-weight:600;font-size:13px;margin-bottom:4px;">${title}</div>
                    <div style="color:#d1d1d1;font-size:12px;line-height:1.4;">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:#8a8a9a;font-size:18px;cursor:pointer;padding:0;">×</button>
            </div>
        `;
        
        toast.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON') {
                this.open();
                this.showTickets();
                if (ticketId) setTimeout(() => this.viewTicket(ticketId), 300);
                toast.remove();
            }
        };
        
        document.body.appendChild(toast);
        
        // Auto-remove after 6 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 6000);
    },
    
    // Show browser notification (if permitted)
    showBrowserNotification: function(title, message) {
        if (!('Notification' in window)) return;
        
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: 'Icon-192.png',
                badge: 'Icon-192.png',
                tag: 'avanti-helpdesk',
                requireInteraction: false
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, {
                        body: message,
                        icon: 'Icon-192.png'
                    });
                }
            });
        }
    },
    
    // Add notification to user's notification center
    addToNotificationCenter: function(ticket, type, title, message) {
        // Store in localStorage for persistence
        const notifications = JSON.parse(localStorage.getItem('avantiTicketNotifications') || '[]');
        
        notifications.unshift({
            id: Date.now(),
            ticketId: ticket.id,
            ticketNumber: ticket.ticketId || ticket.id.slice(0,8),
            type,
            title,
            message,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // Keep only last 20 notifications
        if (notifications.length > 20) notifications.pop();
        
        localStorage.setItem('avantiTicketNotifications', JSON.stringify(notifications));
        
        // Update unread count
        this.updateNotificationBadge();
    },
    
    // Update notification badge count
    updateNotificationBadge: function() {
        const notifications = JSON.parse(localStorage.getItem('avantiTicketNotifications') || '[]');
        const unreadCount = notifications.filter(n => !n.read).length;
        
        // Update help button with notification indicator
        const btn = document.getElementById('avantiBtn');
        if (btn) {
            let indicator = btn.querySelector('.notif-indicator');
            if (unreadCount > 0) {
                if (!indicator) {
                    indicator = document.createElement('span');
                    indicator.className = 'notif-indicator';
                    indicator.style.cssText = `
                        position: absolute;
                        top: -4px;
                        right: -4px;
                        background: #ef4444;
                        color: white;
                        font-size: 10px;
                        font-weight: 700;
                        min-width: 16px;
                        height: 16px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0 4px;
                    `;
                    btn.style.position = 'relative';
                    btn.appendChild(indicator);
                }
                indicator.textContent = unreadCount > 9 ? '9+' : unreadCount;
            } else if (indicator) {
                indicator.remove();
            }
        }
    },
    
    // ✅ FIX: Optimized - periodic fetch instead of realtime
    loadUserNotifications: function() {
        if (!this.firebaseReady || !this.user) return;
        
        const userId = this.user.studentId || this.user.email;
        if (!userId) return;
        
        const fetchUserNotifications = async () => {
            try {
                const snap = await firebase.firestore().collection('user_notifications')
                    .where('userId', '==', String(userId))
                    .get();
                    
                const readIds = JSON.parse(localStorage.getItem('readTicketNotifications') || '[]');
                const unread = snap.docs.filter(d => !readIds.includes(d.id));
                
                this.unreadNotifications = unread.length;
                this.updatePWABadge();
                
                console.log('[AvantiWidget] ✓ Unread notifications:', this.unreadNotifications);
            } catch (err) {
                console.log('[AvantiWidget] Notifications error:', err);
            }
        };
        
        // Initial fetch
        fetchUserNotifications();
        
        // ✅ COST FIX: Refresh every 3 minutes instead of 60 seconds (saves ~₹500/month)
        this.userNotificationInterval = setInterval(fetchUserNotifications, 180000);
    },
    
    // FIXED: Update PWA notification badge
    updatePWABadge: function() {
        const notifDot = document.getElementById('notifDot');
        if (notifDot) {
            notifDot.classList.toggle('show', this.unreadNotifications > 0);
        }
        
        // Also update document title for PWA
        if (this.unreadNotifications > 0) {
            if (!document.title.startsWith('(')) {
                document.title = `(${this.unreadNotifications}) ${document.title}`;
            }
        } else {
            document.title = document.title.replace(/^\(\d+\)\s*/, '');
        }
    },
    
    // Show greeting popup
    showGreeting: function() {
        const popup = document.getElementById('avantiGreeting');
        const greetingText = document.getElementById('greetingText');
        
        if (greetingText && this.user?.name) {
            const hour = new Date().getHours();
            let timeGreeting = 'Namaste';
            if (hour < 12) timeGreeting = 'Good morning';
            else if (hour < 17) timeGreeting = 'Good afternoon';
            else timeGreeting = 'Good evening';
            
            greetingText.innerHTML = `🙏 <strong>${timeGreeting}, ${this.user.name}!</strong> Need help with the Curriculum Tracker?`;
        }
        
        if (popup && !this.isOpen) {
            popup.classList.add('show');
            
            // Auto hide after 8 seconds
            setTimeout(() => this.hideGreeting(), 8000);
        }
    },
    
    hideGreeting: function() {
        document.getElementById('avantiGreeting')?.classList.remove('show');
    },
    
    // Toggle widget
    toggle: function() {
        if (this.isAnimating) return; // Prevent double-clicks
        this.isAnimating = true;
        
        this.isOpen ? this.close() : this.open();
        
        setTimeout(() => { this.isAnimating = false; }, 350);
    },
    
    open: function() {
        this.isOpen = true;
        this.hideGreeting();
        
        // Use requestAnimationFrame for smoother animation
        requestAnimationFrame(() => {
            document.getElementById('avantiPanel')?.classList.add('open');
            document.getElementById('avantiBtn')?.classList.add('open');
        });
        
        // Mark notifications as read when opened
        if (this.unreadNotifications > 0) {
            this.markNotificationsRead();
        }
    },
    
    close: function() {
        this.isOpen = false;
        
        requestAnimationFrame(() => {
            document.getElementById('avantiPanel')?.classList.remove('open');
            document.getElementById('avantiBtn')?.classList.remove('open');
        });
    },
    
    // Mark notifications as read
    markNotificationsRead: function() {
        if (!this.firebaseReady || !this.user) return;
        
        const userId = this.user.studentId || this.user.email;
        if (!userId) return;
        
        try {
            firebase.firestore().collection('user_notifications')
                .where('userId', '==', String(userId))
                .get()
                .then(snap => {
                    const readIds = snap.docs.map(d => d.id);
                    localStorage.setItem('readTicketNotifications', JSON.stringify(readIds));
                    this.unreadNotifications = 0;
                    this.updatePWABadge();
                });
        } catch (e) {}
    },
    
    // View navigation
    showHome: function() {
        this.currentView = 'home';
        document.getElementById('homeView').style.display = 'flex';
        document.getElementById('chatView').style.display = 'none';
        document.getElementById('ticketsView').style.display = 'none';
        document.getElementById('formView').style.display = 'none';
        
        document.getElementById('navHome').classList.add('active');
        document.getElementById('navTickets').classList.remove('active');
    },
    
    showChat: function() {
        this.currentView = 'chat';
        document.getElementById('homeView').style.display = 'none';
        document.getElementById('chatView').style.display = 'flex';
        document.getElementById('ticketsView').style.display = 'none';
        document.getElementById('formView').style.display = 'none';
        
        document.getElementById('navHome').classList.remove('active');
        document.getElementById('navTickets').classList.remove('active');
        
        // Clear and focus
        document.getElementById('chatMessages').innerHTML = 
            `<div class="avanti-msg bot">Hi! What can I help you with? Type your question below.</div>`;
        document.getElementById('chatInput').focus();
    },
    
    showTickets: function() {
        this.currentView = 'tickets';
        document.getElementById('homeView').style.display = 'none';
        document.getElementById('chatView').style.display = 'none';
        document.getElementById('ticketsView').style.display = 'flex';
        document.getElementById('formView').style.display = 'none';
        
        document.getElementById('navHome').classList.remove('active');
        document.getElementById('navTickets').classList.add('active');
        
        this.renderTickets();
    },
    
    renderTickets: function() {
        const container = document.getElementById('ticketsList');
        
        // Get stored notifications
        const notifications = JSON.parse(localStorage.getItem('avantiTicketNotifications') || '[]');
        const unreadNotifications = notifications.filter(n => !n.read);
        
        // Build notification center HTML if there are unread notifications
        let notificationCenterHTML = '';
        if (unreadNotifications.length > 0) {
            notificationCenterHTML = `
                <div style="margin-bottom:16px;background:rgba(244,180,26,0.1);border:1px solid #F4B41A;border-radius:12px;padding:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <span style="color:#F4B41A;font-weight:600;font-size:13px;">🔔 ${unreadNotifications.length} New Update${unreadNotifications.length > 1 ? 's' : ''}</span>
                        <button onclick="AvantiWidget.clearAllNotifications()" style="background:none;border:none;color:#8a8a9a;font-size:11px;cursor:pointer;text-decoration:underline;">Clear All</button>
                    </div>
                    ${unreadNotifications.slice(0, 3).map(n => `
                        <div onclick="AvantiWidget.viewTicket('${n.ticketId}'); AvantiWidget.markNotificationRead('${n.id}')" style="background:#1a1a24;border:1px solid #2a2a3a;border-radius:8px;padding:10px;margin-bottom:6px;cursor:pointer;">
                            <div style="color:#fff;font-size:12px;font-weight:500;">${n.title}</div>
                            <div style="color:#8a8a9a;font-size:11px;margin-top:4px;">${n.message?.substring(0, 60)}${n.message?.length > 60 ? '...' : ''}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        if (this.tickets.length === 0) {
            container.innerHTML = notificationCenterHTML + `
                <div class="avanti-empty">
                    <div class="icon">📭</div>
                    <h4>No tickets yet</h4>
                    <p>Raise a ticket when you need help!</p>
                    <button class="avanti-action-btn primary" style="margin-top: 16px;" onclick="AvantiWidget.showForm()">
                        🎫 Raise Ticket
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = notificationCenterHTML + this.tickets.map(t => {
            const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt || Date.now());
            const timeAgo = this.timeAgo(date);
            const statusIcon = t.status === 'resolved' ? '✓' : t.status === 'closed' ? '✕' : t.status === 'in-progress' ? '⏳' : '🔴';
            const formattedDate = date.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined});
            
            return `
                <div class="avanti-ticket-card" onclick="AvantiWidget.viewTicket('${t.id}')" style="${t.status === 'closed' || t.status === 'resolved' ? 'opacity: 0.8;' : ''}">
                    <div class="ticket-header">
                        <span class="ticket-id">#${t.ticketId || t.id.slice(0,8)}</span>
                        <span class="status ${t.status || 'open'}">${statusIcon} ${(t.status || 'open').replace('-', ' ')}</span>
                    </div>
                    <div class="subject">${t.subject || 'No subject'}</div>
                    <div class="meta">${formattedDate} • ${timeAgo}${t.replies?.length ? ' • ' + t.replies.length + ' replies' : ''}</div>
                </div>
            `;
        }).join('');
    },
    
    // Mark a single notification as read
    markNotificationRead: function(notifId) {
        const notifications = JSON.parse(localStorage.getItem('avantiTicketNotifications') || '[]');
        const notif = notifications.find(n => n.id == notifId);
        if (notif) {
            notif.read = true;
            localStorage.setItem('avantiTicketNotifications', JSON.stringify(notifications));
            this.updateNotificationBadge();
        }
    },
    
    // Clear all notifications
    clearAllNotifications: function() {
        const notifications = JSON.parse(localStorage.getItem('avantiTicketNotifications') || '[]');
        notifications.forEach(n => n.read = true);
        localStorage.setItem('avantiTicketNotifications', JSON.stringify(notifications));
        this.updateNotificationBadge();
        this.renderTickets();
    },
    
    timeAgo: function(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
        return Math.floor(seconds / 86400) + ' days ago';
    },
    
    viewTicket: function(id) {
        const t = this.tickets.find(x => x.id === id);
        if (!t) return;
        
        this.currentTicketId = id; // Store current ticket for reply/close functions
        
        const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date();
        
        const replies = (t.replies || []).map(r => {
            const rDate = r.timestamp?.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
            return `
                <div style="background:${r.isAdmin ? 'rgba(244,180,26,0.1)' : '#1a1a24'};border:1px solid ${r.isAdmin ? '#F4B41A' : '#2a2a3a'};border-radius:10px;padding:12px;margin-bottom:8px;${r.isAdmin ? 'border-left:3px solid #F4B41A;' : ''}">
                    <div style="font-size:11px;color:#8a8a9a;margin-bottom:6px;">${r.isAdmin ? '👤 Admin' : '👤 You'} • ${rDate.toLocaleString()}</div>
                    <div style="color:#d1d1d1;font-size:13px;">${r.message}</div>
                </div>
            `;
        }).join('');
        
        const isClosed = t.status === 'resolved' || t.status === 'closed';
        
        const container = document.getElementById('ticketsList');
        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <span style="font-family:'Space Mono',monospace;color:#F4B41A;font-size:15px;">#${t.ticketId || t.id.slice(0,8)}</span>
                <span style="font-size:12px;padding:4px 10px;border-radius:20px;background:${
                    t.status === 'resolved' || t.status === 'closed' ? 'rgba(16,185,129,0.2)' : 
                    t.status === 'in-progress' ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)'
                };color:${
                    t.status === 'resolved' || t.status === 'closed' ? '#10b981' : 
                    t.status === 'in-progress' ? '#eab308' : '#ef4444'
                };">${t.status.replace('-', ' ')}</span>
            </div>
            
            <div style="background:#1a1a24;border:1px solid #2a2a3a;border-radius:12px;padding:14px;margin-bottom:16px;">
                <div style="color:#F4B41A;font-size:14px;font-weight:600;margin-bottom:8px;">${t.subject}</div>
                <div style="color:#d1d1d1;font-size:13px;line-height:1.6;">${t.description}</div>
            </div>
            
            ${t.screenshotUrl ? `
                <div style="margin-bottom:16px;">
                    <div style="color:#8a8a9a;font-size:12px;margin-bottom:8px;">📷 Screenshot</div>
                    <img src="${t.screenshotUrl}" style="max-width:100%;border-radius:8px;border:1px solid #2a2a3a;cursor:pointer;" onclick="window.open('${t.screenshotUrl}', '_blank')">
                </div>
            ` : ''}
            
            ${replies ? `
                <div style="margin-bottom:16px;">
                    <div style="color:#8a8a9a;font-size:12px;margin-bottom:8px;">💬 Conversation</div>
                    ${replies}
                </div>
            ` : ''}
            
            <!-- Reply Section -->
            <div style="margin-bottom:16px;padding:14px;background:#1a1a24;border:1px solid #2a2a3a;border-radius:12px;">
                <div style="color:#8a8a9a;font-size:12px;margin-bottom:8px;">✍️ ${isClosed ? 'Reopen & Reply' : 'Send a Reply'}</div>
                <textarea id="userReplyInput" placeholder="Type your reply here..." style="width:100%;background:#12121a;border:1px solid #2a2a3a;border-radius:8px;padding:10px;color:#fff;font-size:13px;resize:none;min-height:60px;"></textarea>
                <div style="display:flex;gap:8px;margin-top:10px;">
                    <button onclick="AvantiWidget.sendUserReply()" style="flex:1;padding:10px 14px;background:linear-gradient(135deg,#F4B41A,#E8B039);color:#000;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;">
                        📤 Send Reply
                    </button>
                    ${!isClosed ? `
                        <button onclick="AvantiWidget.closeUserTicket()" style="padding:10px 14px;background:#2a2a3a;color:#10b981;border:1px solid #10b981;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;">
                            ✓ End Chat
                        </button>
                    ` : `
                        <button onclick="AvantiWidget.reopenUserTicket()" style="padding:10px 14px;background:#2a2a3a;color:#F4B41A;border:1px solid #F4B41A;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;">
                            🔄 Reopen
                        </button>
                    `}
                </div>
            </div>
            
            <button class="avanti-action-btn secondary" style="width:100%;" onclick="AvantiWidget.showTickets()">
                ← Back to Tickets
            </button>
        `;
    },
    
    // Send user reply to ticket
    sendUserReply: async function() {
        const replyInput = document.getElementById('userReplyInput');
        const replyText = replyInput?.value?.trim();
        
        if (!replyText) {
            alert('Please enter a reply message');
            return;
        }
        
        if (!this.currentTicketId || !this.firebaseReady) {
            alert('Cannot send reply. Please try again.');
            return;
        }
        
        try {
            const ticket = this.tickets.find(t => t.id === this.currentTicketId);
            if (!ticket) {
                alert('Ticket not found');
                return;
            }
            
            // Add user reply
            const newReply = {
                message: replyText,
                isAdmin: false,
                senderName: this.user?.name || 'User',
                timestamp: new Date()
            };
            
            const ticketRef = firebase.firestore().collection('helpdesk_tickets').doc(this.currentTicketId);
            
            await ticketRef.update({
                replies: firebase.firestore.FieldValue.arrayUnion(newReply),
                status: 'open', // Reopen if was closed
                lastUserReply: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            replyInput.value = '';
            alert('✓ Reply sent!');
            
            // Refresh ticket view
            setTimeout(() => this.viewTicket(this.currentTicketId), 500);
            
        } catch (e) {
            console.error('Error sending reply:', e);
            alert('Failed to send reply. Please try again.');
        }
    },
    
    // Close ticket by user
    closeUserTicket: async function() {
        if (!confirm('End this chat? You can reopen it later if needed.')) return;
        
        if (!this.currentTicketId || !this.firebaseReady) {
            alert('Cannot close ticket. Please try again.');
            return;
        }
        
        try {
            const ticketRef = firebase.firestore().collection('helpdesk_tickets').doc(this.currentTicketId);
            
            await ticketRef.update({
                status: 'closed',
                closedAt: firebase.firestore.FieldValue.serverTimestamp(),
                closedBy: 'user',
                canReopen: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            alert('✓ Chat ended. You can reopen it anytime.');
            
            // Refresh ticket view
            setTimeout(() => this.viewTicket(this.currentTicketId), 500);
            
        } catch (e) {
            console.error('Error closing ticket:', e);
            alert('Could not close the chat. Please try again.');
        }
    },
    
    // Reopen ticket by user
    reopenUserTicket: async function() {
        if (!this.currentTicketId || !this.firebaseReady) {
            alert('Cannot reopen ticket. Please try again.');
            return;
        }
        
        try {
            const ticketRef = firebase.firestore().collection('helpdesk_tickets').doc(this.currentTicketId);
            
            await ticketRef.update({
                status: 'open',
                reopenedAt: firebase.firestore.FieldValue.serverTimestamp(),
                reopenedBy: 'user',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            alert('✓ Ticket reopened!');
            
            // Refresh ticket view
            setTimeout(() => this.viewTicket(this.currentTicketId), 500);
            
        } catch (e) {
            console.error('Error reopening ticket:', e);
            alert('Could not reopen the ticket. Please try again.');
        }
    },
    
    // Send message in chat
    sendMessage: function() {
        const input = document.getElementById('chatInput');
        const msg = input.value.trim();
        if (!msg) return;
        
        const messages = document.getElementById('chatMessages');
        messages.innerHTML += `<div class="avanti-msg user">${msg}</div>`;
        input.value = '';
        
        this.searchFAQs(msg);
        messages.scrollTop = messages.scrollHeight;
    },
    
    // Search topic - directly shows chat with FAQ results
    searchTopic: function(topic) {
        this.showChat();
        
        const messages = document.getElementById('chatMessages');
        
        // Show user's query
        messages.innerHTML += `<div class="avanti-msg user">${topic}</div>`;
        
        // Show typing indicator
        messages.innerHTML += `
            <div class="avanti-msg bot typing" id="typingTopic">
                Avanti is typing<span>.</span><span>.</span><span>.</span>
            </div>`;
        messages.scrollTop = messages.scrollHeight;
        
        setTimeout(() => {
            document.getElementById('typingTopic')?.remove();
            
            // Search FAQs directly
            const topicResults = this.faqs.filter(f => {
                const t = `${f.question} ${f.answer} ${f.category || ''}`.toLowerCase();
                return t.includes(topic.toLowerCase());
            }).slice(0, 5);
            
            if (topicResults.length) {
                messages.innerHTML += `<div class="avanti-msg bot">Here's help for ${topic}:</div>`;
                topicResults.forEach(f => {
                    messages.innerHTML += `
                        <div class="avanti-faq-card" onclick="AvantiWidget.showFAQAnswer('${f.id}')">
                            <h4>${f.question}</h4>
                            <div class="category">${f.category || 'General'}</div>
                        </div>`;
                });
            } else {
                messages.innerHTML += `<div class="avanti-msg bot">
                    I couldn't find specific articles for ${topic}. Would you like to raise a ticket?
                </div>
                <div class="avanti-action-btns" style="margin:10px 0;">
                    <button class="avanti-action-btn primary" onclick="AvantiWidget.showForm()">
                        🎫 Raise Ticket
                    </button>
                </div>`;
            }
            messages.scrollTop = messages.scrollHeight;
        }, 600);
    },
    
// ENTERPRISE CHAT LOGIC (FINAL)
searchFAQs: function(query) {
    const messages = document.getElementById('chatMessages');
    const q = query.toLowerCase().trim();

    this.botState = this.botState || { unclearCount: 0 };

    // Create unique ID for typing indicator
    const typingId = 'typing_' + Date.now();
    
    messages.innerHTML += `
        <div class="avanti-msg bot typing" id="${typingId}">
            Avanti is typing<span>.</span><span>.</span><span>.</span>
        </div>`;
    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
        document.getElementById(typingId)?.remove();

        // Greeting
        if (/^(hi|hello|hey|namaste)$/.test(q)) {
            this.botState.unclearCount = 0;
            messages.innerHTML += `
                <div class="avanti-msg bot">Hello 👋 How can I help you today?</div>
                <div class="avanti-msg bot">
                    You can ask about:
                    <br>🔐 Login
                    <br>📅 Attendance
                    <br>📚 Curriculum
                </div>`;
            return;
        }

        // Small talk
        if (q.includes('how are you')) {
            messages.innerHTML += `<div class="avanti-msg bot">
                I’m doing well 😊 Please tell me your issue.
            </div>`;
            return;
        }

        if (q.includes('thank')) {
            messages.innerHTML += `<div class="avanti-msg bot">
                You’re welcome. Happy to help.
            </div>`;
            return;
        }

        // Intent detection - directly search FAQs for these topics (NO recursion)
        const intents = [
            { k:'login', w:['login','password','otp'] },
            { k:'attendance', w:['attendance','present','absent'] },
            { k:'curriculum', w:['curriculum','chapter','syllabus'] }
        ];

        for (const i of intents) {
            if (i.w.some(w => q.includes(w))) {
                this.botState.unclearCount = 0;
                // Direct FAQ search for this topic (no recursion)
                const topicResults = this.faqs.filter(f => {
                    const t = `${f.question} ${f.answer} ${f.category || ''}`.toLowerCase();
                    return t.includes(i.k);
                }).slice(0,5);
                
                if (topicResults.length) {
                    messages.innerHTML += `<div class="avanti-msg bot">Here's help for ${i.k}:</div>`;
                    topicResults.forEach(f => {
                        messages.innerHTML += `
                            <div class="avanti-faq-card" onclick="AvantiWidget.showFAQAnswer('${f.id}')">
                                <h4>${f.question}</h4>
                                <div class="category">${f.category || 'General'}</div>
                            </div>`;
                    });
                } else {
                    messages.innerHTML += `<div class="avanti-msg bot">
                        I couldn't find specific articles for ${i.k}. Would you like to raise a ticket?
                    </div>
                    <div class="avanti-action-btns" style="margin:10px 0;">
                        <button class="avanti-action-btn primary" onclick="AvantiWidget.showForm()">
                            🎫 Raise Ticket
                        </button>
                    </div>`;
                }
                return;
            }
        }

        // FAQ match
        const words = q.split(/\s+/).filter(w => w.length > 2);
        const results = this.faqs.filter(f => {
            const t = `${f.question} ${f.answer}`.toLowerCase();
            return words.filter(w => t.includes(w)).length >= 2;
        }).slice(0,3);

        if (results.length) {
            this.botState.unclearCount = 0;
            messages.innerHTML += `<div class="avanti-msg bot">Here’s what I found:</div>`;
            results.forEach(f => {
                messages.innerHTML += `
                    <div class="avanti-faq-card" onclick="AvantiWidget.showFAQAnswer('${f.id}')">
                        <h4>${f.question}</h4>
                        <div class="category">${f.category || 'General'}</div>
                    </div>`;
            });
            return;
        }

        // Controlled fallback (NO instant ticket)
        this.botState.unclearCount++;

        if (this.botState.unclearCount === 1) {
            messages.innerHTML += `<div class="avanti-msg bot">
                Can you clarify a bit more?
                Is this about login, attendance, or curriculum?
            </div>`;
            return;
        }

        if (this.botState.unclearCount === 2) {
            messages.innerHTML += `
                <div class="avanti-msg bot">
                    Thanks for your patience.
                    Please raise a ticket for detailed support.
                </div>
                <div class="avanti-action-btns" style="margin:10px 0;">
                    <button class="avanti-action-btn primary" onclick="AvantiWidget.showForm()">
                        🎫 Raise Ticket
                    </button>
                </div>`;
        }
    }, 600);
},

    // Show FAQ Answer when user clicks on a FAQ card
    showFAQAnswer: function(faqId) {
        const faq = this.faqs.find(f => f.id === faqId);
        if (!faq) {
            console.log('[AvantiWidget] FAQ not found:', faqId);
            return;
        }
        
        const messages = document.getElementById('chatMessages');
        
        // Show the answer in a styled card
        messages.innerHTML += `
            <div class="avanti-msg bot">
                <div style="margin-bottom:8px;color:#F4B41A;font-weight:600;">
                    📖 ${faq.question}
                </div>
                <div style="line-height:1.6;color:#e0e0e0;">
                    ${faq.answer}
                </div>
                ${faq.steps ? `
                    <div style="margin-top:12px;padding:12px;background:#1a1a24;border-radius:8px;border:1px solid #2a2a3a;">
                        <div style="color:#F4B41A;font-size:12px;margin-bottom:8px;">📋 Steps:</div>
                        <div style="color:#d0d0d0;font-size:13px;line-height:1.7;">
                            ${faq.steps}
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="avanti-msg bot" style="padding:10px;">
                <div style="color:#8a8a9a;font-size:13px;margin-bottom:10px;">Was this helpful?</div>
                <div style="display:flex;gap:10px;">
                    <button onclick="AvantiWidget.faqFeedback('${faqId}', true)" style="flex:1;padding:10px;border:1px solid #10b981;background:rgba(16,185,129,0.1);color:#10b981;border-radius:8px;cursor:pointer;font-size:14px;">
                        👍 Yes
                    </button>
                    <button onclick="AvantiWidget.faqFeedback('${faqId}', false)" style="flex:1;padding:10px;border:1px solid #ef4444;background:rgba(239,68,68,0.1);color:#ef4444;border-radius:8px;cursor:pointer;font-size:14px;">
                        👎 No
                    </button>
                </div>
            </div>
        `;
        
        messages.scrollTop = messages.scrollHeight;
    },
    
    // Handle FAQ feedback
    faqFeedback: function(faqId, helpful) {
        const messages = document.getElementById('chatMessages');
        
        if (helpful) {
            messages.innerHTML += `
                <div class="avanti-msg bot">
                    Great! 😊 Glad I could help. Is there anything else you need?
                </div>
            `;
        } else {
            messages.innerHTML += `
                <div class="avanti-msg bot">
                    I'm sorry that didn't help. Would you like to raise a support ticket for personalized assistance?
                </div>
                <div class="avanti-action-btns" style="margin:10px 0;">
                    <button class="avanti-action-btn primary" onclick="AvantiWidget.showForm()">
                        🎫 Raise Ticket
                    </button>
                </div>
            `;
        }
        
        messages.scrollTop = messages.scrollHeight;
        
        // Optionally track feedback in Firestore
        if (this.firebaseReady) {
            try {
                firebase.firestore().collection('helpdesk_faq_feedback').add({
                    faqId: faqId,
                    helpful: helpful,
                    userId: this.user?.studentId || this.user?.email || 'anonymous',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (e) {
                console.log('[AvantiWidget] Could not save feedback:', e);
            }
        }
    },
    
    // Show form view
    showForm: function() {
        this.currentView = 'form';
        document.getElementById('homeView').style.display = 'none';
        document.getElementById('chatView').style.display = 'none';
        document.getElementById('ticketsView').style.display = 'none';
        document.getElementById('formView').style.display = 'flex';
        
        this.screenshotFile = null;
        this.screenshotDataUrl = null;
        
        const formContent = document.getElementById('formContent');
        
        if (this.user) {
            // Logged in user - auto-filled form
            formContent.innerHTML = `
                <div class="avanti-user-info">
                    <div class="user-header">
                        ✓ Logged in as ${this.user.type === 'student' ? 'Student' : 'Teacher'}
                    </div>
                    <div class="avanti-user-row">
                        <span>Name:</span>
                        <span>${this.user.name || 'N/A'}</span>
                    </div>
                    ${this.user.type === 'student' ? `
                        <div class="avanti-user-row">
                            <span>Student ID:</span>
                            <span>${this.user.studentId || 'N/A'}</span>
                        </div>
                        <div class="avanti-user-row">
                            <span>Grade:</span>
                            <span>Class ${this.user.grade || 'N/A'}</span>
                        </div>
                    ` : `
                        <div class="avanti-user-row">
                            <span>Email:</span>
                            <span>${this.user.email || 'N/A'}</span>
                        </div>
                    `}
                    <div class="avanti-user-row">
                        <span>School:</span>
                        <span>${this.user.school || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="avanti-form-group">
                    <label>Issue Category</label>
                    <select id="formCategory">
                        <option value="login">Login Issues</option>
                        <option value="attendance">Attendance</option>
                        <option value="curriculum">Curriculum & Progress</option>
                        <option value="technical">Technical Error</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="avanti-form-group">
                    <label>Subject *</label>
                    <input type="text" id="formSubject" placeholder="Brief description of your issue">
                </div>
                
                <div class="avanti-form-group">
                    <label>Describe your issue *</label>
                    <textarea id="formDesc" placeholder="Please provide details..."></textarea>
                </div>
                
                <div class="avanti-screenshot-section">
                    <div class="avanti-screenshot-label">Screenshot (optional - max 2MB)</div>
                    <div class="avanti-screenshot-upload" onclick="document.getElementById('screenshotInput').click()">
                        <div class="upload-icon">📷</div>
                        <div class="upload-text">Click to upload screenshot</div>
                        <input type="file" id="screenshotInput" accept="image/*" onchange="AvantiWidget.handleScreenshot(this)">
                    </div>
                    <div class="avanti-screenshot-preview" id="screenshotPreview">
                        <img id="screenshotImg" src="">
                        <button class="remove-btn" onclick="AvantiWidget.removeScreenshot()">×</button>
                    </div>
                    <div class="avanti-upload-progress" id="uploadProgress" style="display: none;">
                        <div class="avanti-progress-bar">
                            <div class="avanti-progress-fill" id="progressFill"></div>
                        </div>
                        <div class="avanti-progress-text" id="progressText">Compressing image...</div>
                    </div>
                </div>
                
                <button class="avanti-submit-btn" id="formSubmitBtn" onclick="AvantiWidget.submitTicket()">
                    🎫 Submit Ticket
                </button>
                
                <button class="avanti-action-btn secondary" style="width:100%;margin-top:10px;" onclick="AvantiWidget.showHome()">
                    ← Back to Home
                </button>
            `;
        } else {
            // Not logged in - manual form
            formContent.innerHTML = `
                <div class="avanti-msg bot" style="background:#1a1a24;border:1px solid #f59e0b;margin-bottom:16px;border-radius:12px;padding:14px;">
                    ⚠️ <strong>Not logged in</strong><br>
                    <span style="color:#8a8a9a;font-size:13px;">Please fill in your details below.</span>
                </div>
                
                <div class="avanti-form-group">
                    <label>Your Name *</label>
                    <input type="text" id="formName" placeholder="Enter your name">
                </div>
                
                <div class="avanti-form-group">
                    <label>Student ID (if student)</label>
                    <input type="text" id="formStudentId" placeholder="e.g., JNV001">
                </div>
                
                <div class="avanti-form-group">
                    <label>Email (if teacher)</label>
                    <input type="email" id="formEmail" placeholder="your.email@school.com">
                </div>
                
                <div class="avanti-form-group">
                    <label>School Name *</label>
                    <input type="text" id="formSchool" placeholder="e.g., JNV Dhar, CoE Barwani">
                </div>
                
                <div class="avanti-form-group">
                    <label>Issue Category</label>
                    <select id="formCategory">
                        <option value="login">Login Issues</option>
                        <option value="attendance">Attendance</option>
                        <option value="curriculum">Curriculum & Progress</option>
                        <option value="technical">Technical Error</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="avanti-form-group">
                    <label>Subject *</label>
                    <input type="text" id="formSubject" placeholder="Brief description of your issue">
                </div>
                
                <div class="avanti-form-group">
                    <label>Describe your issue *</label>
                    <textarea id="formDesc" placeholder="Please provide details..."></textarea>
                </div>
                
                <div class="avanti-screenshot-section">
                    <div class="avanti-screenshot-label">Screenshot (optional - max 2MB)</div>
                    <div class="avanti-screenshot-upload" onclick="document.getElementById('screenshotInput').click()">
                        <div class="upload-icon">📷</div>
                        <div class="upload-text">Click to upload screenshot</div>
                        <input type="file" id="screenshotInput" accept="image/*" onchange="AvantiWidget.handleScreenshot(this)">
                    </div>
                    <div class="avanti-screenshot-preview" id="screenshotPreview">
                        <img id="screenshotImg" src="">
                        <button class="remove-btn" onclick="AvantiWidget.removeScreenshot()">×</button>
                    </div>
                    <div class="avanti-upload-progress" id="uploadProgress" style="display: none;">
                        <div class="avanti-progress-bar">
                            <div class="avanti-progress-fill" id="progressFill"></div>
                        </div>
                        <div class="avanti-progress-text" id="progressText">Compressing image...</div>
                    </div>
                </div>
                
                <button class="avanti-submit-btn" id="formSubmitBtn" onclick="AvantiWidget.submitTicketManual()">
                    🎫 Submit Ticket
                </button>
                
                <button class="avanti-action-btn secondary" style="width:100%;margin-top:10px;" onclick="AvantiWidget.showHome()">
                    ← Back to Home
                </button>
            `;
        }
    },
    
    // FIXED: Handle screenshot upload with compression - FASTER VERSION
    isUploadingScreenshot: false, // Flag to prevent auto-submit during upload
    
    handleScreenshot: function(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // Set upload flag to prevent any auto-submit
            this.isUploadingScreenshot = true;
            
            // Show progress
            const progressEl = document.getElementById('uploadProgress');
            const progressText = document.getElementById('progressText');
            const progressFill = document.getElementById('progressFill');
            
            if (progressEl) progressEl.style.display = 'block';
            if (progressText) progressText.textContent = 'Processing...';
            if (progressFill) progressFill.style.width = '10%';
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                if (progressEl) progressEl.style.display = 'none';
                input.value = '';
                this.isUploadingScreenshot = false;
                return;
            }
            
            // Always compress for faster uploads - even small files benefit
            if (progressText) progressText.textContent = 'Optimizing...';
            this.compressImageFast(file).then(compressedFile => {
                this.setScreenshot(compressedFile);
            }).catch(err => {
                console.error('Compression error:', err);
                // Use original if compression fails and file is under 2MB
                if (file.size <= 2 * 1024 * 1024) {
                    this.setScreenshot(file);
                } else {
                    alert('Image is too large. Please try a smaller file.');
                    if (progressEl) progressEl.style.display = 'none';
                    input.value = '';
                    this.isUploadingScreenshot = false;
                }
            });
        }
    },
    
    // FASTER compression - aggressive settings for quick uploads
    compressImageFast: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // Aggressive resize - max 600px for very fast uploads
                    const maxDim = 600;
                    
                    if (width > height && width > maxDim) {
                        height = (height * maxDim) / width;
                        width = maxDim;
                    } else if (height > maxDim) {
                        width = (width * maxDim) / height;
                        height = maxDim;
                    }
                    
                    canvas.width = Math.round(width);
                    canvas.height = Math.round(height);
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    const progressFill = document.getElementById('progressFill');
                    const progressText = document.getElementById('progressText');
                    if (progressFill) progressFill.style.width = '50%';
                    if (progressText) progressText.textContent = 'Compressing...';
                    
                    // Very aggressive compression (0.4 quality) for fast upload
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], 'screenshot.jpg', {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            console.log('[AvantiWidget] Compressed:', (file.size/1024).toFixed(0) + 'KB →', (compressedFile.size/1024).toFixed(0) + 'KB');
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Compression failed'));
                        }
                    }, 'image/jpeg', 0.4);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    setScreenshot: function(file) {
        this.screenshotFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.screenshotDataUrl = e.target.result;
            const imgEl = document.getElementById('screenshotImg');
            const previewEl = document.getElementById('screenshotPreview');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const progressEl = document.getElementById('uploadProgress');
            
            if (imgEl) imgEl.src = e.target.result;
            if (previewEl) previewEl.style.display = 'block';
            if (progressFill) progressFill.style.width = '100%';
            if (progressText) progressText.textContent = '✓ Ready!';
            
            setTimeout(() => {
                if (progressEl) progressEl.style.display = 'none';
                this.isUploadingScreenshot = false; // Upload complete, safe to submit
            }, 400);
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
    
    // Upload screenshot to Firebase Storage
    uploadScreenshot: async function(ticketId) {
        if (!this.screenshotFile) return null;
        
        // If Firebase is not ready, return the base64 data URL instead
        if (!this.firebaseReady) {
            console.log('[AvantiWidget] Firebase not ready, using base64 for screenshot');
            return this.screenshotDataUrl || null;
        }
        
        try {
            const storageRef = firebase.storage().ref();
            const safeTicketId = String(ticketId).replace(/[^a-zA-Z0-9]/g, '_');
            const fileRef = storageRef.child(`helpdesk_screenshots/${safeTicketId}_${Date.now()}.jpg`);
            
            // Create upload with timeout
            const uploadPromise = new Promise(async (resolve, reject) => {
                try {
                    const uploadTask = fileRef.put(this.screenshotFile);
                    
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                            console.log('[AvantiWidget] Upload progress:', progress + '%');
                        },
                        (error) => {
                            console.error('[AvantiWidget] Upload error during task:', error);
                            reject(error);
                        },
                        async () => {
                            try {
                                const url = await fileRef.getDownloadURL();
                                resolve(url);
                            } catch (urlError) {
                                reject(urlError);
                            }
                        }
                    );
                } catch (err) {
                    reject(err);
                }
            });
            
            // Set a 30-second timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Upload timeout')), 30000);
            });
            
            const result = await Promise.race([uploadPromise, timeoutPromise]);
            return result;
            
        } catch (e) {
            console.error('[AvantiWidget] Screenshot upload error:', e);
            // Return base64 as fallback if upload fails
            if (this.screenshotDataUrl) {
                console.log('[AvantiWidget] Using base64 fallback for screenshot');
                return this.screenshotDataUrl;
            }
            return null;
        }
    },
    
    // Submit ticket (logged in user) - FIXED: Prevents auto-submit during upload
    submitTicket: async function() {
        // Prevent submission while screenshot is being processed
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
        btn.innerHTML = '<span class="avanti-loading"></span> Submitting...';
        
        try {
            const ticketId = 'AV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2,5).toUpperCase();
            
            let screenshotUrl = null;
            if (this.screenshotFile) {
                btn.innerHTML = '<span class="avanti-loading"></span> Uploading screenshot...';
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
                screenshotUrl: screenshotUrl,
                status: 'open',
                priority: 'medium',
                replies: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Reload tickets immediately
            this.loadTickets();
            
            this.showSuccess(ticketId);
        } catch (err) {
            console.error(err);
            alert('Failed to submit. Please try again.');
            btn.disabled = false;
            btn.innerHTML = '🎫 Submit Ticket';
        }
    },
    
    // Submit ticket (manual entry) - FIXED: Prevents auto-submit during upload
    submitTicketManual: async function() {
        // Prevent submission while screenshot is being processed
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
        btn.innerHTML = '<span class="avanti-loading"></span> Submitting...';
        
        try {
            const ticketId = 'AV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2,5).toUpperCase();
            
            let screenshotUrl = null;
            if (this.screenshotFile) {
                btn.innerHTML = '<span class="avanti-loading"></span> Uploading screenshot...';
                screenshotUrl = await this.uploadScreenshot(ticketId);
            }
            
            await firebase.firestore().collection('helpdesk_tickets').add({
                ticketId,
                userName: name,
                userEmail: email || '',
                studentId: studentId || null,
                school: school,
                userRole: studentId ? 'Student' : (email ? 'Teacher' : 'Unknown'),
                category,
                subject,
                description: desc,
                screenshotUrl: screenshotUrl,
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
    
    // Show success view
    showSuccess: function(ticketId) {
        const formContent = document.getElementById('formContent');
        formContent.innerHTML = `
            <div class="avanti-success">
                <div class="icon">✅</div>
                <h3>Ticket Submitted!</h3>
                <div class="ticket-id">${ticketId}</div>
                <p>We've received your ticket. You'll be notified when there's an update.</p>
                <button class="avanti-action-btn primary" style="margin-top: 20px;" onclick="AvantiWidget.showTickets()">
                    View My Tickets
                </button>
                <button class="avanti-action-btn secondary" style="margin-top: 10px;" onclick="AvantiWidget.showHome()">
                    Back to Home
                </button>
            </div>
        `;
    }
};

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AvantiWidget.init());
    } else {
        AvantiWidget.init();
    }
})();
