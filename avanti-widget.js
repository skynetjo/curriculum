/**
 * ============================================
 * AVANTI HELP DESK WIDGET v5.0
 * ============================================
 * 
 * Standalone widget file - Include with just one line:
 * <script src="avanti-widget.js"></script>
 * 
 * Make sure Firebase is loaded before this script.
 * 
 * FEATURES:
 * - FAQ search & display
 * - Support ticket creation
 * - Real-time ticket updates
 * - Screenshot upload with compression
 * - PWA notification support
 * - Modern Intercom-like UI
 * 
 * CHANGELOG v5.0:
 * - Separated into standalone file
 * - Fixed duplicate message bug
 * - Premium UI styling
 * - Better animations
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        logoUrl: './logo.png', // Change this to your logo path
        companyName: 'Avanti Help Desk',
        tagline: "We're here to help!",
        greeting: {
            morning: '🙏 Namaste! सुप्रभातम् 🌅',
            afternoon: '🙏 Namaste! शुभमध्याह्नम् 🌇',
            evening: '🙏 Namaste! शुभसायंकालम् 🌃'
        },
        quickActions: [
            { icon: '🔐', label: 'Login Issues', topic: 'login' },
            { icon: '📅', label: 'Attendance Help', topic: 'attendance' },
            { icon: '📚', label: 'Curriculum & Progress', topic: 'curriculum' }
        ],
        showGreetingPopup: true,
        greetingDelay: 3000 // ms before showing greeting popup
    };

    // ============================================
    // INJECT CSS STYLES
    // ============================================
    function injectStyles() {
        // Add Google Fonts
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        const styles = `
/* ============================================
   AVANTI WIDGET STYLES v5.0
   ============================================ */

/* Greeting Popup */
.avanti-greeting-popup {
    position: fixed;
    bottom: 105px;
    right: 30px;
    background: linear-gradient(135deg, rgba(18,18,26,0.98) 0%, rgba(26,26,36,0.98) 100%);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 18px 22px;
    max-width: 300px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                0 0 0 1px rgba(255,255,255,0.05);
    z-index: 99980;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transform: translateY(15px) scale(0.95);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    will-change: opacity, transform;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}

.avanti-greeting-popup::before {
    content: '';
    position: absolute;
    bottom: -8px;
    right: 32px;
    width: 16px;
    height: 16px;
    background: linear-gradient(135deg, rgba(18,18,26,0.98) 0%, rgba(26,26,36,0.98) 100%);
    transform: rotate(45deg);
    border-right: 1px solid rgba(255,255,255,0.1);
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.avanti-greeting-popup.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
}

.avanti-greeting-popup .greeting-text {
    color: #f0f0f5;
    font-size: 15px;
    line-height: 1.6;
    font-weight: 500;
}

.avanti-greeting-popup .greeting-close {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255,255,255,0.05);
    border: none;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    line-height: 1;
    border-radius: 8px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.avanti-greeting-popup .greeting-close:hover {
    color: #fff;
    background: rgba(255,255,255,0.15);
    transform: scale(1.1);
}

/* Help Button */
.avanti-help-btn {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #F4B41A 0%, #E8A830 50%, #D4941A 100%);
    border: none;
    cursor: pointer;
    box-shadow: 0 8px 32px rgba(244, 180, 26, 0.4),
                0 0 0 0 rgba(244, 180, 26, 0.4);
    z-index: 99990;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    transform: translateZ(0);
    will-change: transform;
    animation: btnPulse 3s ease-in-out infinite;
}

@keyframes btnPulse {
    0%, 100% { box-shadow: 0 8px 32px rgba(244, 180, 26, 0.4), 0 0 0 0 rgba(244, 180, 26, 0.2); }
    50% { box-shadow: 0 8px 32px rgba(244, 180, 26, 0.4), 0 0 0 12px rgba(244, 180, 26, 0); }
}

@media (max-width: 768px) {
    .avanti-help-btn {
        bottom: 85px !important;
        right: 20px;
        width: 56px;
        height: 56px;
    }
    
    .avanti-greeting-popup {
        bottom: 150px;
        right: 15px;
        max-width: 280px;
    }
}

.avanti-help-btn:hover {
    transform: scale(1.12) translateZ(0);
    box-shadow: 0 12px 45px rgba(244, 180, 26, 0.6),
                0 0 0 6px rgba(244, 180, 26, 0.15);
    animation: none;
}

.avanti-help-btn:active {
    transform: scale(0.95) translateZ(0);
}

.avanti-help-btn .btn-icon {
    width: 30px;
    height: 30px;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
}

.avanti-help-btn:hover .btn-icon {
    transform: rotate(15deg) scale(1.1);
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

.avanti-help-btn.open .btn-icon {
    transform: rotate(90deg);
}

.avanti-help-btn .btn-icon svg.close-icon {
    display: none;
}

/* PWA Notification Badge */
.avanti-help-btn .notification-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border-radius: 50%;
    border: 3px solid #12121a;
    display: none;
    animation: pulseBadge 2s infinite;
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
}

.avanti-help-btn .notification-dot.show {
    display: block;
}

@keyframes pulseBadge {
    0%, 100% { transform: scale(1); box-shadow: 0 0 12px rgba(239, 68, 68, 0.5); }
    50% { transform: scale(1.15); box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); }
}

/* Widget Panel */
.avanti-widget-panel {
    position: fixed;
    bottom: 100px;
    right: 30px;
    width: 400px;
    height: 560px;
    background: linear-gradient(180deg, #0f0f17 0%, #12121a 100%);
    border-radius: 24px;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 
                0 0 0 1px rgba(255,255,255,0.05),
                0 0 40px rgba(244, 180, 26, 0.1);
    z-index: 99998;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255,255,255,0.08);
    opacity: 0;
    visibility: hidden;
    transform: translateY(30px) scale(0.9);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow: hidden;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    will-change: opacity, transform;
}

/* Sending spinner animation */
.send-spinner, .sending-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0,0,0,0.2);
    border-top-color: #0a0a0f;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Button sending state */
.avanti-chat-input button.sending {
    pointer-events: none;
    opacity: 0.7;
}

.avanti-chat-input button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.avanti-widget-panel.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
}

/* Header - Premium gradient with glass effect */
.avanti-widget-header {
    background: linear-gradient(135deg, #F4B41A 0%, #E8A830 50%, #D4941A 100%);
    padding: 18px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 75px;
    position: relative;
    overflow: hidden;
}

/* Subtle shine effect on header */
.avanti-widget-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: headerShine 3s ease-in-out infinite;
}

@keyframes headerShine {
    0%, 100% { left: -100%; }
    50% { left: 100%; }
}

.avanti-widget-header-content {
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
    z-index: 1;
}

.avanti-widget-header .logo {
    width: 46px;
    height: 46px;
    background: rgba(0,0,0,0.12);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    position: relative;
    overflow: hidden;
}

.avanti-widget-header .logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 14px;
}

/* Online status indicator */
.avanti-widget-header .logo::after {
    content: '';
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: #10b981;
    border-radius: 50%;
    border: 2px solid #F4B41A;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    animation: pulse-green 2s ease-in-out infinite;
}

@keyframes pulse-green {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
}

.avanti-widget-header h3 {
    color: #0a0a0f;
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.3px;
}

.avanti-widget-header p {
    color: rgba(0,0,0,0.55);
    font-size: 13px;
    margin: 3px 0 0 0;
    font-weight: 500;
}

/* Close button - premium styling */
.avanti-widget-header .close-btn {
    background: rgba(0,0,0,0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: none;
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 600;
    color: #0a0a0f;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    position: relative;
    z-index: 1;
}

.avanti-widget-header .close-btn:hover,
.avanti-widget-header .close-btn:active {
    background: rgba(0,0,0,0.2);
    transform: scale(1.08) rotate(90deg);
}

/* Body with subtle gradient */
.avanti-widget-body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #12121a 0%, #0f0f17 100%);
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

/* Search Box - Modern glass effect */
.avanti-search-box {
    background: linear-gradient(135deg, rgba(26,26,36,0.9) 0%, rgba(22,22,32,0.9) 100%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.avanti-search-box:hover {
    border-color: rgba(244, 180, 26, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.25), 0 0 30px rgba(244, 180, 26, 0.1);
}

.avanti-search-box span {
    color: rgba(255,255,255,0.5);
    font-size: 15px;
}

.avanti-search-box .arrow {
    margin-left: auto;
    color: #F4B41A;
    font-size: 20px;
    transition: transform 0.3s ease;
}

.avanti-search-box:hover .arrow {
    transform: translateX(4px);
}

/* Quick Actions - Premium interactive cards */
.avanti-quick-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
}

.avanti-quick-action {
    background: linear-gradient(135deg, rgba(26,26,36,0.9) 0%, rgba(22,22,32,0.9) 100%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
    color: #f0f0f5;
    font-size: 14px;
    font-family: inherit;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.avanti-quick-action:hover {
    border-color: rgba(244, 180, 26, 0.5);
    transform: translateX(6px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.2), 0 0 20px rgba(244, 180, 26, 0.08);
    background: linear-gradient(135deg, rgba(32,32,44,0.95) 0%, rgba(26,26,36,0.95) 100%);
}

.avanti-quick-action .icon {
    font-size: 20px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avanti-quick-action .arrow {
    margin-left: auto;
    color: rgba(255,255,255,0.3);
    transition: all 0.3s ease;
}

.avanti-quick-action:hover .arrow {
    color: #F4B41A;
    transform: translateX(4px);
}

/* Bottom Navigation - Modern tab design */
.avanti-bottom-nav {
    display: flex;
    border-top: 1px solid rgba(255,255,255,0.06);
    background: linear-gradient(180deg, rgba(10,10,15,0.98) 0%, rgba(8,8,12,1) 100%);
    padding: 10px 8px;
    gap: 4px;
}

.avanti-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 10px 8px;
    cursor: pointer;
    color: rgba(255,255,255,0.4);
    font-size: 11px;
    font-weight: 500;
    background: transparent;
    border: none;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
    position: relative;
}

.avanti-nav-item:hover {
    color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.05);
}

.avanti-nav-item.active {
    color: #F4B41A;
    background: rgba(244, 180, 26, 0.1);
}

.avanti-nav-item .nav-icon {
    font-size: 20px;
    transition: transform 0.3s ease;
}

.avanti-nav-item:hover .nav-icon {
    transform: scale(1.1);
}

.avanti-nav-item.active .nav-icon {
    transform: scale(1.15);
}

.avanti-nav-item .nav-badge {
    position: absolute;
    top: 6px;
    right: calc(50% - 18px);
    width: 10px;
    height: 10px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border-radius: 50%;
    display: none;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
    animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
}

.avanti-nav-item .nav-badge.show {
    display: block;
}

/* Chat View - Premium conversation design */
.avanti-chat-view {
    display: none;
    flex-direction: column;
    height: 100%;
}

.avanti-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    background: linear-gradient(180deg, rgba(15,15,23,0.5) 0%, rgba(12,12,18,0.8) 100%);
    scroll-behavior: smooth;
}

/* Custom scrollbar for widget */
.avanti-chat-messages::-webkit-scrollbar,
.avanti-tickets-list::-webkit-scrollbar,
.avanti-form-content::-webkit-scrollbar {
    width: 6px;
}

.avanti-chat-messages::-webkit-scrollbar-track,
.avanti-tickets-list::-webkit-scrollbar-track,
.avanti-form-content::-webkit-scrollbar-track {
    background: transparent;
}

.avanti-chat-messages::-webkit-scrollbar-thumb,
.avanti-tickets-list::-webkit-scrollbar-thumb,
.avanti-form-content::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.15);
    border-radius: 3px;
}

.avanti-chat-messages::-webkit-scrollbar-thumb:hover,
.avanti-tickets-list::-webkit-scrollbar-thumb:hover,
.avanti-form-content::-webkit-scrollbar-thumb:hover {
    background: rgba(244, 180, 26, 0.4);
}

.avanti-chat-input {
    padding: 14px 16px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex;
    gap: 12px;
    background: linear-gradient(180deg, rgba(10,10,15,0.95), rgba(12,12,18,1));
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.avanti-chat-input input {
    flex: 1;
    background: rgba(26,26,36,0.8);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    padding: 14px 20px;
    color: #fff;
    font-size: 15px;
    font-family: inherit;
    transition: all 0.3s ease;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

.avanti-chat-input input:focus {
    outline: none;
    border-color: #F4B41A;
    box-shadow: 0 0 0 3px rgba(244, 180, 26, 0.15), inset 0 2px 4px rgba(0,0,0,0.2);
    background: rgba(30,30,42,0.9);
}

.avanti-chat-input input::placeholder {
    color: rgba(255,255,255,0.4);
}

.avanti-chat-input button {
    background: linear-gradient(135deg, #F4B41A 0%, #E8A830 100%);
    border: none;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #0a0a0f;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 15px rgba(244, 180, 26, 0.3);
}

.avanti-chat-input button:hover:not(:disabled) {
    transform: scale(1.1) rotate(15deg);
    box-shadow: 0 6px 25px rgba(244, 180, 26, 0.5);
}

/* Messages - Modern bubble design */
.avanti-msg {
    padding: 14px 18px;
    border-radius: 20px;
    font-size: 14px;
    line-height: 1.6;
    max-width: 85%;
    animation: msgSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    word-wrap: break-word;
}

@keyframes msgSlideIn {
    from { 
        opacity: 0; 
        transform: translateY(15px) scale(0.95); 
    }
    to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
    }
}

.avanti-msg.bot {
    background: linear-gradient(135deg, rgba(26,26,36,0.95) 0%, rgba(22,22,32,0.95) 100%);
    color: #f0f0f5;
    align-self: flex-start;
    border: 1px solid rgba(255,255,255,0.08);
    border-bottom-left-radius: 6px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.avanti-msg.user {
    background: linear-gradient(135deg, #F4B41A 0%, #E8A830 100%);
    color: #0a0a0f;
    align-self: flex-end;
    border-bottom-right-radius: 6px;
    box-shadow: 0 4px 15px rgba(244, 180, 26, 0.25);
    font-weight: 500;
}

/* Typing indicator enhancement */
.avanti-msg.typing {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 8px 0;
}

.avanti-msg.typing span {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #F4B41A;
    border-radius: 50%;
    margin: 0 2px;
    animation: typingBounce 1.4s ease-in-out infinite;
}

.avanti-msg.typing span:nth-child(1) { animation-delay: 0s; }
.avanti-msg.typing span:nth-child(2) { animation-delay: 0.2s; }
.avanti-msg.typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
}

/* FAQ Results - Premium cards */
.avanti-faq-card {
    background: linear-gradient(135deg, rgba(26,26,36,0.9) 0%, rgba(22,22,32,0.9) 100%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.avanti-faq-card:hover {
    border-color: rgba(244, 180, 26, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.2), 0 0 20px rgba(244, 180, 26, 0.1);
}

.avanti-faq-card h4 {
    color: #f0f0f5;
    font-size: 14px;
    margin: 0;
    line-height: 1.5;
    font-weight: 600;
}

.avanti-faq-card .category {
    font-size: 11px;
    color: #F4B41A;
    text-transform: uppercase;
    margin-top: 8px;
    font-weight: 600;
    letter-spacing: 0.5px;
}

/* FAQ Answer */
.avanti-faq-answer {
    background: linear-gradient(135deg, rgba(26,26,36,0.9) 0%, rgba(22,22,32,0.9) 100%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 12px;
}

.avanti-faq-answer h4 {
    color: #F4B41A;
    font-size: 14px;
    margin: 0 0 12px 0;
    font-weight: 600;
}

.avanti-faq-answer p {
    color: #d1d1d1;
    font-size: 14px;
    line-height: 1.7;
    margin: 0;
}

/* Feedback Buttons */
.avanti-feedback-btns {
    display: flex;
    gap: 10px;
    margin-top: 12px;
}

.avanti-feedback-btn {
    flex: 1;
    padding: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(26,26,36,0.8);
    border-radius: 12px;
    cursor: pointer;
    color: #fff;
    font-size: 13px;
    transition: all 0.3s ease;
    font-family: inherit;
    font-weight: 500;
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
    padding: 18px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
}

.avanti-tickets-header h3 {
    color: #fff;
    font-size: 18px;
    margin: 0;
    font-weight: 600;
}

.avanti-tickets-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
}

/* Ticket Card - Premium conversation list style */
.avanti-ticket-card {
    background: linear-gradient(135deg, rgba(26,26,36,0.9) 0%, rgba(22,22,32,0.9) 100%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.avanti-ticket-card:hover {
    border-color: rgba(244, 180, 26, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.avanti-ticket-card .ticket-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.avanti-ticket-card .ticket-id {
    font-family: 'Space Mono', monospace;
    color: #F4B41A;
    font-size: 13px;
    font-weight: 600;
}

.avanti-ticket-card .status {
    font-size: 11px;
    padding: 5px 12px;
    border-radius: 20px;
    text-transform: capitalize;
    font-weight: 600;
    letter-spacing: 0.3px;
}

.avanti-ticket-card .status.open {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.2);
}

.avanti-ticket-card .status.in-progress {
    background: rgba(234, 179, 8, 0.15);
    color: #fbbf24;
    box-shadow: 0 0 12px rgba(234, 179, 8, 0.2);
}

.avanti-ticket-card .status.resolved {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
}

.avanti-ticket-card .status.closed {
    background: rgba(107, 114, 128, 0.15);
    color: #9ca3af;
}

.avanti-ticket-card .status.pending {
    background: rgba(168, 85, 247, 0.15);
    color: #c084fc;
    box-shadow: 0 0 12px rgba(168, 85, 247, 0.2);
}

.avanti-ticket-card .subject {
    color: #f0f0f5;
    font-size: 14px;
    margin-bottom: 8px;
    font-weight: 500;
    line-height: 1.4;
}

.avanti-ticket-card .meta {
    color: rgba(255,255,255,0.4);
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

/* Action Buttons - Premium interactive design */
.avanti-action-btns {
    display: flex;
    gap: 12px;
    margin-top: 18px;
}

.avanti-action-btn {
    flex: 1;
    padding: 14px 16px;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
    border: none;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.avanti-action-btn.primary {
    background: linear-gradient(135deg, #F4B41A 0%, #E8A830 100%);
    color: #0a0a0f;
    box-shadow: 0 4px 20px rgba(244, 180, 26, 0.3);
}

.avanti-action-btn.primary:hover {
    box-shadow: 0 6px 30px rgba(244, 180, 26, 0.45);
    transform: translateY(-3px);
}

.avanti-action-btn.secondary {
    background: rgba(26,26,36,0.9);
    border: 1px solid rgba(255,255,255,0.1);
    color: #f0f0f5;
}

.avanti-action-btn.secondary:hover {
    background: rgba(32,32,44,0.95);
    border-color: rgba(244, 180, 26, 0.3);
    transform: translateY(-3px);
}

.avanti-action-btn:active {
    transform: translateY(0);
}

/* User Info Display */
.avanti-user-info {
    background: linear-gradient(135deg, rgba(26,26,36,0.9) 0%, rgba(22,22,32,0.9) 100%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 18px;
}

.avanti-user-info .user-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    color: #10b981;
    font-size: 13px;
    font-weight: 600;
}

.avanti-user-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 13px;
}

.avanti-user-row:last-child {
    border-bottom: none;
}

.avanti-user-row .label {
    color: rgba(255,255,255,0.5);
}

.avanti-user-row .value {
    color: #fff;
    font-weight: 500;
}

/* Form Inputs */
.avanti-form-group {
    margin-bottom: 18px;
}

.avanti-form-group label {
    display: block;
    color: rgba(255,255,255,0.7);
    font-size: 13px;
    margin-bottom: 8px;
    font-weight: 500;
}

.avanti-form-group input,
.avanti-form-group select,
.avanti-form-group textarea {
    width: 100%;
    background: rgba(26,26,36,0.8);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 14px 16px;
    color: #fff;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.3s ease;
    box-sizing: border-box;
}

.avanti-form-group input:focus,
.avanti-form-group select:focus,
.avanti-form-group textarea:focus {
    outline: none;
    border-color: #F4B41A;
    box-shadow: 0 0 0 3px rgba(244, 180, 26, 0.15);
}

.avanti-form-group textarea {
    min-height: 100px;
    resize: vertical;
}

.avanti-form-group input::placeholder,
.avanti-form-group textarea::placeholder {
    color: rgba(255,255,255,0.35);
}

/* Success Message */
.avanti-success {
    text-align: center;
    padding: 30px 20px;
}

.avanti-success .icon {
    font-size: 60px;
    margin-bottom: 16px;
}

.avanti-success h3 {
    color: #fff;
    font-size: 22px;
    margin: 0 0 10px 0;
}

.avanti-success .ticket-id {
    font-family: 'Space Mono', monospace;
    background: rgba(244, 180, 26, 0.15);
    color: #F4B41A;
    padding: 10px 20px;
    border-radius: 10px;
    display: inline-block;
    font-size: 16px;
    margin-bottom: 14px;
    font-weight: 600;
}

.avanti-success p {
    color: rgba(255,255,255,0.6);
    font-size: 14px;
    line-height: 1.6;
}

/* Toast Notification */
.avanti-toast {
    position: fixed;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    padding: 14px 28px;
    border-radius: 30px;
    font-size: 14px;
    font-weight: 600;
    z-index: 999999;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.avanti-toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.avanti-toast-success {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
}

.avanti-toast-error {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
}

.avanti-toast-info {
    background: linear-gradient(135deg, #F4B41A, #E8A830);
    color: #0a0a0f;
}

/* Screenshot Preview */
.screenshot-preview {
    margin-top: 12px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.1);
}

.screenshot-preview img {
    width: 100%;
    display: block;
}

.screenshot-actions {
    display: flex;
    gap: 8px;
    padding: 10px;
    background: rgba(0,0,0,0.3);
}

.screenshot-actions button {
    flex: 1;
    padding: 8px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .avanti-widget-panel {
        bottom: 0;
        right: 0;
        left: 0;
        width: 100%;
        height: 100%;
        max-height: 100vh;
        border-radius: 0;
        transform: translateY(100%);
    }
    
    .avanti-widget-panel.open {
        transform: translateY(0);
    }
    
    .avanti-widget-header {
        padding: 16px;
        min-height: 65px;
    }
    
    .avanti-widget-header .close-btn {
        width: 44px;
        height: 44px;
    }
    
    .avanti-widget-header .logo {
        width: 40px;
        height: 40px;
    }
    
    .avanti-widget-header h3 {
        font-size: 16px;
    }
    
    .avanti-widget-header p {
        font-size: 12px;
    }
}
`;
        const styleEl = document.createElement('style');
        styleEl.id = 'avanti-widget-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    // ============================================
    // INJECT HTML
    // ============================================
    function injectHTML() {
        const container = document.createElement('div');
        container.className = 'avanti-widget-container';
        container.innerHTML = `
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
                    <img src="${CONFIG.logoUrl}" alt="Logo" onerror="this.style.display='none'; this.parentElement.innerHTML='💬';">
                </div>
                <div>
                    <h3>${CONFIG.companyName}</h3>
                    <p>${CONFIG.tagline}</p>
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
                    ${CONFIG.quickActions.map(action => `
                        <button class="avanti-quick-action" onclick="AvantiWidget.searchTopic('${action.topic}')">
                            <span class="icon">${action.icon}</span>
                            <span>${action.label}</span>
                            <span class="arrow">›</span>
                        </button>
                    `).join('')}
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
        `;
        document.body.appendChild(container);
    }

    // ============================================
    // WIDGET LOGIC
    // ============================================
    window.AvantiWidget = {
        isOpen: false,
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
        isSending: false,
        _isSendingReply: false,
        currentTicketId: null,
        
        // Get time-based greeting
        getGreeting: function(name) {
            const hour = new Date().getHours();
            const nameStr = name ? ` ${name}` : '';
            
            if (hour < 12) {
                return CONFIG.greeting.morning.replace('!', nameStr + '!');
            } else if (hour < 17) {
                return CONFIG.greeting.afternoon.replace('!', nameStr + '!');
            } else {
                return CONFIG.greeting.evening.replace('!', nameStr + '!');
            }
        },
        
        // Initialize
        init: function() {
            console.log('[AvantiWidget] Starting initialization v5.0...');
            
            // Try to get user from localStorage (for students)
            this.getStudentFromStorage();
            
            // Wait for Firebase
            this.waitForFirebase();
            
            // Show greeting popup after delay
            if (CONFIG.showGreetingPopup) {
                setTimeout(() => this.showGreetingPopup(), CONFIG.greetingDelay);
            }
            
            // Make sure button is visible
            this.ensureButtonVisible();
            
            console.log('[AvantiWidget] ✓ Initialization complete');
        },
        
        // Get student info from localStorage
        getStudentFromStorage: function() {
            try {
                const studentName = localStorage.getItem('studentName');
                const studentId = localStorage.getItem('studentId');
                const school = localStorage.getItem('school') || localStorage.getItem('selectedSchool');
                
                if (studentName && studentId) {
                    this.user = {
                        type: 'student',
                        name: studentName,
                        studentId: studentId,
                        school: school || 'Unknown',
                        email: null
                    };
                    console.log('[AvantiWidget] ✓ Student detected:', this.user.name);
                    this.updateWelcomeText();
                }
            } catch (e) {
                console.log('[AvantiWidget] Could not read localStorage');
            }
        },
        
        // Get teacher info from Firebase
        getTeacherFromFirebase: function() {
            if (this.user) return; // Already have user
            
            try {
                const fbUser = firebase.auth().currentUser;
                if (fbUser) {
                    this.user = {
                        type: 'teacher',
                        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Teacher',
                        email: fbUser.email,
                        uid: fbUser.uid,
                        school: null
                    };
                    console.log('[AvantiWidget] ✓ Teacher detected:', this.user.name);
                    this.updateWelcomeText();
                }
            } catch (e) {
                console.log('[AvantiWidget] Firebase auth not ready yet');
            }
        },
        
        // Update welcome text
        updateWelcomeText: function() {
            const welcomeEl = document.getElementById('welcomeText');
            if (welcomeEl && this.user?.name) {
                welcomeEl.textContent = this.getGreeting(this.user.name);
            }
        },
        
        // Wait for Firebase to be initialized
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
        
        // Ensure button is visible
        ensureButtonVisible: function() {
            const btn = document.getElementById('avantiBtn');
            if (btn) {
                btn.style.display = 'flex';
                btn.style.opacity = '1';
                btn.style.visibility = 'visible';
            }
        },
        
        // Show greeting popup
        showGreetingPopup: function() {
            const greeting = document.getElementById('avantiGreeting');
            if (greeting && !this.isOpen) {
                greeting.classList.add('show');
                
                // Auto hide after 8 seconds
                setTimeout(() => this.hideGreeting(), 8000);
            }
        },
        
        // Hide greeting popup
        hideGreeting: function() {
            const greeting = document.getElementById('avantiGreeting');
            if (greeting) {
                greeting.classList.remove('show');
            }
        },
        
        // Toggle widget
        toggle: function() {
            if (this.isAnimating) return;
            
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },
        
        // Open widget
        open: function() {
            if (this.isAnimating || this.isOpen) return;
            
            this.isAnimating = true;
            this.isOpen = true;
            this.hideGreeting();
            
            const panel = document.getElementById('avantiPanel');
            const btn = document.getElementById('avantiBtn');
            
            if (panel) panel.classList.add('open');
            if (btn) btn.classList.add('open');
            
            setTimeout(() => {
                this.isAnimating = false;
            }, 400);
        },
        
        // Close widget
        close: function() {
            if (this.isAnimating || !this.isOpen) return;
            
            this.isAnimating = true;
            this.isOpen = false;
            
            const panel = document.getElementById('avantiPanel');
            const btn = document.getElementById('avantiBtn');
            
            if (panel) panel.classList.remove('open');
            if (btn) btn.classList.remove('open');
            
            setTimeout(() => {
                this.isAnimating = false;
            }, 400);
        },
        
        // Navigation functions
        setActiveNav: function(navId) {
            document.querySelectorAll('.avanti-nav-item').forEach(item => {
                item.classList.remove('active');
            });
            const nav = document.getElementById(navId);
            if (nav) nav.classList.add('active');
        },
        
        showHome: function() {
            this.currentView = 'home';
            this.setActiveNav('navHome');
            
            document.getElementById('homeView').style.display = 'flex';
            document.getElementById('chatView').style.display = 'none';
            document.getElementById('ticketsView').style.display = 'none';
            document.getElementById('formView').style.display = 'none';
        },
        
        showChat: function() {
            this.currentView = 'chat';
            this.setActiveNav('navHome');
            
            document.getElementById('homeView').style.display = 'none';
            document.getElementById('chatView').style.display = 'flex';
            document.getElementById('ticketsView').style.display = 'none';
            document.getElementById('formView').style.display = 'none';
            
            document.getElementById('chatInput').focus();
        },
        
        showTickets: function() {
            this.currentView = 'tickets';
            this.setActiveNav('navTickets');
            
            document.getElementById('homeView').style.display = 'none';
            document.getElementById('chatView').style.display = 'none';
            document.getElementById('ticketsView').style.display = 'flex';
            document.getElementById('formView').style.display = 'none';
            
            this.loadTickets();
        },
        
        showForm: function() {
            this.currentView = 'form';
            
            document.getElementById('homeView').style.display = 'none';
            document.getElementById('chatView').style.display = 'none';
            document.getElementById('ticketsView').style.display = 'none';
            document.getElementById('formView').style.display = 'flex';
            
            this.renderTicketForm();
        },
        
        // Load FAQs from Firebase
        loadFAQs: async function() {
            if (!this.firebaseReady) return;
            
            try {
                const snapshot = await firebase.firestore()
                    .collection('helpdesk_faqs')
                    .where('isActive', '==', true)
                    .get();
                
                this.faqs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                console.log('[AvantiWidget] ✓ Loaded', this.faqs.length, 'FAQs');
            } catch (e) {
                console.error('[AvantiWidget] Error loading FAQs:', e);
            }
        },
        
        // Load user's tickets
        loadTickets: async function() {
            if (!this.firebaseReady || !this.user) {
                this.renderTicketsList([]);
                return;
            }
            
            try {
                let query = firebase.firestore().collection('helpdesk_tickets');
                
                if (this.user.type === 'student') {
                    query = query.where('studentId', '==', this.user.studentId);
                } else if (this.user.email) {
                    query = query.where('userEmail', '==', this.user.email);
                } else {
                    this.renderTicketsList([]);
                    return;
                }
                
                const snapshot = await query.get();
                
                // Sort client-side
                this.tickets = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => {
                    const aTime = a.createdAt?.toDate?.() || new Date(0);
                    const bTime = b.createdAt?.toDate?.() || new Date(0);
                    return bTime - aTime;
                });
                
                this.renderTicketsList(this.tickets);
                console.log('[AvantiWidget] ✓ Loaded', this.tickets.length, 'tickets');
            } catch (e) {
                console.error('[AvantiWidget] Error loading tickets:', e);
                this.renderTicketsList([]);
            }
        },
        
        // Render tickets list
        renderTicketsList: function(tickets) {
            const container = document.getElementById('ticketsList');
            if (!container) return;
            
            if (!tickets.length) {
                container.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;color:#8a8a9a;">
                        <div style="font-size:48px;margin-bottom:16px;">📭</div>
                        <p style="margin:0 0 16px 0;">No tickets yet</p>
                        <button class="avanti-action-btn primary" onclick="AvantiWidget.showForm()">
                            🎫 Create Your First Ticket
                        </button>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = tickets.map(t => {
                const date = t.createdAt?.toDate?.() || new Date();
                const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                
                return `
                    <div class="avanti-ticket-card" onclick="AvantiWidget.viewTicket('${t.id}')">
                        <div class="ticket-header">
                            <span class="ticket-id">#${t.ticketId || t.id.slice(-6).toUpperCase()}</span>
                            <span class="status ${t.status}">${t.status}</span>
                        </div>
                        <div class="subject">${this.escapeHtml(t.subject || 'No subject')}</div>
                        <div class="meta">${dateStr} • ${t.category || 'General'}</div>
                    </div>
                `;
            }).join('');
        },
        
        // Send message in chat - with duplicate prevention
        sendMessage: function() {
            if (this.isSending) {
                console.log('[AvantiWidget] Message already being sent');
                return;
            }
            
            const input = document.getElementById('chatInput');
            const sendBtn = document.getElementById('chatSendBtn');
            const msg = input.value.trim();
            if (!msg) return;
            
            this.isSending = true;
            input.disabled = true;
            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.classList.add('sending');
                sendBtn.innerHTML = '<span class="send-spinner"></span>';
            }
            
            const messages = document.getElementById('chatMessages');
            messages.innerHTML += `<div class="avanti-msg user">${this.escapeHtml(msg)}</div>`;
            input.value = '';
            
            this.searchFAQs(msg);
            messages.scrollTop = messages.scrollHeight;
            
            setTimeout(() => {
                this.isSending = false;
                input.disabled = false;
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.classList.remove('sending');
                    sendBtn.innerHTML = '➤';
                }
                input.focus();
            }, 300);
        },
        
        // Search FAQs
        searchFAQs: function(query) {
            const messages = document.getElementById('chatMessages');
            const q = query.toLowerCase().trim();
            
            this.botState = this.botState || { unclearCount: 0 };
            
            const typingId = 'typing_' + Date.now();
            messages.innerHTML += `
                <div class="avanti-msg bot typing" id="${typingId}">
                    <span></span><span></span><span></span>
                </div>`;
            messages.scrollTop = messages.scrollHeight;
            
            setTimeout(() => {
                document.getElementById(typingId)?.remove();
                
                // Greeting
                if (/^(hi|hello|hey|namaste)$/i.test(q)) {
                    messages.innerHTML += `
                        <div class="avanti-msg bot">Hello 👋 How can I help you today?</div>
                        <div class="avanti-msg bot">
                            You can ask about:<br>
                            🔐 Login<br>
                            📅 Attendance<br>
                            📚 Curriculum
                        </div>`;
                    return;
                }
                
                // Small talk
                if (q.includes('thank')) {
                    messages.innerHTML += `<div class="avanti-msg bot">You're welcome! 😊</div>`;
                    return;
                }
                
                // Search FAQs
                const words = q.split(/\s+/).filter(w => w.length > 2);
                const results = this.faqs.filter(f => {
                    const text = `${f.question} ${f.answer} ${f.category || ''}`.toLowerCase();
                    return words.filter(w => text.includes(w)).length >= 1;
                }).slice(0, 3);
                
                if (results.length) {
                    messages.innerHTML += `<div class="avanti-msg bot">Here's what I found:</div>`;
                    results.forEach(f => {
                        messages.innerHTML += `
                            <div class="avanti-faq-card" onclick="AvantiWidget.showFAQAnswer('${f.id}')">
                                <h4>${f.question}</h4>
                                <div class="category">${f.category || 'General'}</div>
                            </div>`;
                    });
                } else {
                    messages.innerHTML += `
                        <div class="avanti-msg bot">
                            I couldn't find an answer for that. Would you like to raise a support ticket?
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
        
        // Show FAQ answer
        showFAQAnswer: function(faqId) {
            const faq = this.faqs.find(f => f.id === faqId);
            if (!faq) return;
            
            const messages = document.getElementById('chatMessages');
            messages.innerHTML += `
                <div class="avanti-faq-answer">
                    <h4>${faq.question}</h4>
                    <p>${faq.answer}</p>
                </div>
                <div class="avanti-feedback-btns">
                    <button class="avanti-feedback-btn yes" onclick="AvantiWidget.faqFeedback('${faqId}', true)">
                        👍 Helpful
                    </button>
                    <button class="avanti-feedback-btn no" onclick="AvantiWidget.faqFeedback('${faqId}', false)">
                        👎 Not Helpful
                    </button>
                </div>`;
            messages.scrollTop = messages.scrollHeight;
        },
        
        // FAQ feedback
        faqFeedback: function(faqId, helpful) {
            const messages = document.getElementById('chatMessages');
            
            if (helpful) {
                messages.innerHTML += `<div class="avanti-msg bot">Great! Glad I could help! 😊</div>`;
            } else {
                messages.innerHTML += `
                    <div class="avanti-msg bot">
                        I'm sorry that wasn't helpful. Would you like to raise a support ticket?
                    </div>
                    <div class="avanti-action-btns" style="margin:10px 0;">
                        <button class="avanti-action-btn primary" onclick="AvantiWidget.showForm()">
                            🎫 Raise Ticket
                        </button>
                    </div>`;
            }
            messages.scrollTop = messages.scrollHeight;
        },
        
        // Render ticket form
        renderTicketForm: function() {
            const formContent = document.getElementById('formContent');
            
            const userInfoHtml = this.user ? `
                <div class="avanti-user-info">
                    <div class="user-header">✓ Logged in as ${this.user.type}</div>
                    <div class="avanti-user-row">
                        <span class="label">Name</span>
                        <span class="value">${this.user.name}</span>
                    </div>
                    ${this.user.email ? `
                        <div class="avanti-user-row">
                            <span class="label">Email</span>
                            <span class="value">${this.user.email}</span>
                        </div>
                    ` : ''}
                    ${this.user.studentId ? `
                        <div class="avanti-user-row">
                            <span class="label">Student ID</span>
                            <span class="value">${this.user.studentId}</span>
                        </div>
                    ` : ''}
                </div>
            ` : `
                <div class="avanti-form-group">
                    <label>Your Name *</label>
                    <input type="text" id="ticketName" placeholder="Enter your name" required>
                </div>
                <div class="avanti-form-group">
                    <label>Email or Student ID *</label>
                    <input type="text" id="ticketContact" placeholder="Email or Student ID" required>
                </div>
            `;
            
            formContent.innerHTML = `
                <h3 style="color:#fff;margin:0 0 20px 0;font-size:20px;">🎫 Raise a Ticket</h3>
                
                ${userInfoHtml}
                
                <div class="avanti-form-group">
                    <label>Category *</label>
                    <select id="ticketCategory">
                        <option value="login">🔐 Login Issues</option>
                        <option value="attendance">📅 Attendance</option>
                        <option value="curriculum">📚 Curriculum</option>
                        <option value="technical">🔧 Technical Problem</option>
                        <option value="other">❓ Other</option>
                    </select>
                </div>
                
                <div class="avanti-form-group">
                    <label>Subject *</label>
                    <input type="text" id="ticketSubject" placeholder="Brief description of your issue" required>
                </div>
                
                <div class="avanti-form-group">
                    <label>Description *</label>
                    <textarea id="ticketDescription" placeholder="Please describe your issue in detail..."></textarea>
                </div>
                
                <div class="avanti-form-group">
                    <label>Screenshot (optional)</label>
                    <input type="file" id="ticketScreenshot" accept="image/*" onchange="AvantiWidget.handleScreenshot(event)" 
                           style="padding:10px;background:rgba(26,26,36,0.8);border:1px dashed rgba(255,255,255,0.2);">
                    <div id="screenshotPreview"></div>
                </div>
                
                <div class="avanti-action-btns">
                    <button class="avanti-action-btn secondary" onclick="AvantiWidget.showHome()">
                        ← Back
                    </button>
                    <button class="avanti-action-btn primary" onclick="AvantiWidget.submitTicket()">
                        Submit Ticket
                    </button>
                </div>
            `;
        },
        
        // Handle screenshot upload
        handleScreenshot: function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Compress image
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxSize = 800;
                    let width = img.width;
                    let height = img.height;
                    
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
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    this.screenshotDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    
                    document.getElementById('screenshotPreview').innerHTML = `
                        <div class="screenshot-preview">
                            <img src="${this.screenshotDataUrl}" alt="Screenshot">
                            <div class="screenshot-actions">
                                <button onclick="AvantiWidget.removeScreenshot()" style="background:#ef4444;color:white;">
                                    Remove
                                </button>
                            </div>
                        </div>
                    `;
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },
        
        // Remove screenshot
        removeScreenshot: function() {
            this.screenshotDataUrl = null;
            document.getElementById('screenshotPreview').innerHTML = '';
            document.getElementById('ticketScreenshot').value = '';
        },
        
        // Submit ticket
        submitTicket: async function() {
            if (!this.firebaseReady) {
                alert('Please wait, connecting to server...');
                return;
            }
            
            const category = document.getElementById('ticketCategory').value;
            const subject = document.getElementById('ticketSubject').value.trim();
            const description = document.getElementById('ticketDescription').value.trim();
            
            if (!subject || !description) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Get user info
            let userName, userEmail, studentId, school;
            
            if (this.user) {
                userName = this.user.name;
                userEmail = this.user.email;
                studentId = this.user.studentId;
                school = this.user.school;
            } else {
                userName = document.getElementById('ticketName')?.value?.trim();
                const contact = document.getElementById('ticketContact')?.value?.trim();
                
                if (!userName || !contact) {
                    alert('Please enter your name and contact');
                    return;
                }
                
                if (contact.includes('@')) {
                    userEmail = contact;
                } else {
                    studentId = contact;
                }
            }
            
            const ticketId = 'AVANTI' + Date.now().toString(36).toUpperCase();
            
            try {
                // Upload screenshot if exists
                let screenshotUrl = null;
                if (this.screenshotDataUrl) {
                    const storageRef = firebase.storage().ref();
                    const screenshotRef = storageRef.child(`helpdesk_screenshots/${ticketId}.jpg`);
                    await screenshotRef.putString(this.screenshotDataUrl, 'data_url');
                    screenshotUrl = await screenshotRef.getDownloadURL();
                }
                
                // Create ticket
                await firebase.firestore().collection('helpdesk_tickets').add({
                    ticketId: ticketId,
                    category: category,
                    subject: subject,
                    description: description,
                    userName: userName,
                    userEmail: userEmail || null,
                    studentId: studentId || null,
                    school: school || null,
                    screenshotUrl: screenshotUrl,
                    status: 'open',
                    priority: 'medium',
                    replies: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                this.screenshotDataUrl = null;
                this.showTicketSuccess(ticketId);
                
            } catch (e) {
                console.error('[AvantiWidget] Error submitting ticket:', e);
                alert('Failed to submit ticket. Please try again.');
            }
        },
        
        // Show ticket success
        showTicketSuccess: function(ticketId) {
            const formContent = document.getElementById('formContent');
            formContent.innerHTML = `
                <div class="avanti-success">
                    <div class="icon">✅</div>
                    <h3>Ticket Submitted!</h3>
                    <div class="ticket-id">${ticketId}</div>
                    <p>We've received your ticket. You'll be notified when there's an update.</p>
                    <button class="avanti-action-btn primary" style="margin-top:20px;" onclick="AvantiWidget.showTickets()">
                        View My Tickets
                    </button>
                    <button class="avanti-action-btn secondary" style="margin-top:10px;" onclick="AvantiWidget.showHome()">
                        Back to Home
                    </button>
                </div>
            `;
        },
        
        // View ticket details
        viewTicket: function(ticketId) {
            const ticket = this.tickets.find(t => t.id === ticketId);
            if (!ticket) return;
            
            this.currentTicketId = ticketId;
            
            document.getElementById('ticketsView').style.display = 'none';
            document.getElementById('formView').style.display = 'flex';
            
            const formContent = document.getElementById('formContent');
            const date = ticket.createdAt?.toDate?.() || new Date();
            const dateStr = date.toLocaleDateString('en-IN', { 
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            
            const repliesHtml = (ticket.replies || []).map(r => {
                const rDate = r.timestamp?.toDate?.() || new Date(r.timestamp) || new Date();
                const rDateStr = rDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                const isAdmin = r.isAdmin;
                
                return `
                    <div style="padding:12px;margin-bottom:10px;border-radius:12px;
                                background:${isAdmin ? 'rgba(244,180,26,0.1)' : 'rgba(26,26,36,0.8)'};
                                border-left:3px solid ${isAdmin ? '#F4B41A' : '#3b82f6'};">
                        <div style="font-size:11px;color:${isAdmin ? '#F4B41A' : '#3b82f6'};margin-bottom:6px;">
                            ${isAdmin ? '👤 Admin' : '👤 You'} • ${rDateStr}
                        </div>
                        <div style="color:#e0e0e0;font-size:14px;line-height:1.5;">
                            ${this.escapeHtml(r.message)}
                        </div>
                    </div>
                `;
            }).join('');
            
            formContent.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <h3 style="color:#fff;margin:0;font-size:18px;">
                        Ticket <span style="color:#F4B41A;">#${ticket.ticketId || ticketId.slice(-6).toUpperCase()}</span>
                    </h3>
                    <span class="status ${ticket.status}" style="padding:6px 14px;border-radius:20px;font-size:12px;">
                        ${ticket.status}
                    </span>
                </div>
                
                <div style="color:#8a8a9a;font-size:13px;margin-bottom:16px;">
                    📅 ${dateStr} • ${ticket.category || 'General'}
                </div>
                
                <div style="background:rgba(26,26,36,0.8);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:16px;margin-bottom:18px;">
                    <div style="color:#F4B41A;font-size:15px;font-weight:600;margin-bottom:10px;">${this.escapeHtml(ticket.subject)}</div>
                    <div style="color:#d1d1d1;font-size:14px;line-height:1.6;">${this.escapeHtml(ticket.description)}</div>
                </div>
                
                ${ticket.screenshotUrl ? `
                    <div style="margin-bottom:18px;">
                        <div style="color:#8a8a9a;font-size:12px;margin-bottom:8px;">📷 Screenshot</div>
                        <img src="${ticket.screenshotUrl}" style="max-width:100%;border-radius:10px;border:1px solid rgba(255,255,255,0.1);cursor:pointer;" onclick="window.open('${ticket.screenshotUrl}', '_blank')">
                    </div>
                ` : ''}
                
                ${repliesHtml ? `
                    <div style="margin-bottom:18px;">
                        <div style="color:#8a8a9a;font-size:12px;margin-bottom:10px;">💬 Conversation</div>
                        ${repliesHtml}
                    </div>
                ` : ''}
                
                <div style="background:rgba(26,26,36,0.8);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:16px;margin-bottom:18px;">
                    <div style="color:#8a8a9a;font-size:12px;margin-bottom:10px;">✍️ Send a Reply</div>
                    <textarea id="userReplyInput" placeholder="Type your reply here..." 
                              style="width:100%;background:rgba(15,15,23,0.8);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px;color:#fff;font-size:14px;resize:none;min-height:70px;box-sizing:border-box;"></textarea>
                    <div style="display:flex;gap:10px;margin-top:12px;">
                        <button onclick="AvantiWidget.sendUserReply()" style="flex:1;padding:12px;background:linear-gradient(135deg,#F4B41A,#E8A830);color:#0a0a0f;border:none;border-radius:10px;font-weight:600;cursor:pointer;font-size:14px;">
                            📤 Send Reply
                        </button>
                    </div>
                </div>
                
                <button class="avanti-action-btn secondary" style="width:100%;" onclick="AvantiWidget.showTickets()">
                    ← Back to Tickets
                </button>
            `;
        },
        
        // Send user reply
        sendUserReply: async function() {
            if (this._isSendingReply) return;
            
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
            
            this._isSendingReply = true;
            replyInput.disabled = true;
            
            try {
                const newReply = {
                    message: replyText,
                    isAdmin: false,
                    senderName: this.user?.name || 'User',
                    timestamp: new Date()
                };
                
                const ticketRef = firebase.firestore().collection('helpdesk_tickets').doc(this.currentTicketId);
                
                await ticketRef.update({
                    replies: firebase.firestore.FieldValue.arrayUnion(newReply),
                    status: 'open',
                    lastUserReply: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                replyInput.value = '';
                this._showToast('✓ Reply sent!', 'success');
                
                // Refresh ticket view
                await this.loadTickets();
                setTimeout(() => this.viewTicket(this.currentTicketId), 300);
                
            } catch (e) {
                console.error('[AvantiWidget] Error sending reply:', e);
                this._showToast('Failed to send. Please try again.', 'error');
            } finally {
                this._isSendingReply = false;
                if (replyInput) replyInput.disabled = false;
            }
        },
        
        // Show toast notification
        _showToast: function(message, type = 'info') {
            document.getElementById('avantiToast')?.remove();
            
            const toast = document.createElement('div');
            toast.id = 'avantiToast';
            toast.className = `avanti-toast avanti-toast-${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => toast.classList.add('show'), 10);
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2500);
        },
        
        // Escape HTML
        escapeHtml: function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // ============================================
    // INITIALIZE
    // ============================================
    function initialize() {
        injectStyles();
        injectHTML();
        
        // Init after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => AvantiWidget.init());
        } else {
            AvantiWidget.init();
        }
    }

    // Start initialization
    initialize();
})();
