/* ================================
   AVANTI CHATBOT – ENTERPRISE FINAL
   ================================ */

(function () {

  let typingTimeout = null;

  AvantiWidget.botState = { unclearCount: 0 };

  AvantiWidget.showTyping = function () {
    const messages = document.getElementById('chatMessages');
    if (!messages || document.getElementById('typing')) return;

    messages.innerHTML += `
      <div class="avanti-msg bot" id="typing">
        Avanti is typing...
      </div>`;
    messages.scrollTop = messages.scrollHeight;
  };

  AvantiWidget.hideTyping = function () {
    document.getElementById('typing')?.remove();
  };

  AvantiWidget.searchFAQs = function (query) {
    const messages = document.getElementById('chatMessages');
    const q = query.toLowerCase().trim();

    // clear previous typing
    clearTimeout(typingTimeout);
    AvantiWidget.hideTyping();
    AvantiWidget.showTyping();

    typingTimeout = setTimeout(() => {
      AvantiWidget.hideTyping();

      /* GREETING */
      if (/^(hi|hello|hey|namaste)$/.test(q)) {
        AvantiWidget.botState.unclearCount = 0;
        messages.innerHTML += `
          <div class="avanti-msg bot">
            Hello 👋 How can I help you today?
          </div>
          <div class="avanti-msg bot">
            🔐 Login<br>
            📅 Attendance<br>
            📚 Curriculum
          </div>`;
        return;
      }

      /* SMALL TALK */
      if (q.includes('how are you')) {
        messages.innerHTML += `
          <div class="avanti-msg bot">
            I’m doing well 😊 Please tell me your issue.
          </div>`;
        return;
      }

      if (q.includes('thank')) {
        messages.innerHTML += `
          <div class="avanti-msg bot">
            You’re welcome. Happy to help.
          </div>`;
        return;
      }

      /* INTENT ROUTING */
      const intents = [
        { key: 'login', words: ['login','password','otp'] },
        { key: 'attendance', words: ['attendance','present','absent'] },
        { key: 'curriculum', words: ['curriculum','chapter','syllabus'] }
      ];

      for (const i of intents) {
        if (i.words.some(w => q.includes(w))) {
          AvantiWidget.botState.unclearCount = 0;
          AvantiWidget.searchTopic(i.key);
          return;
        }
      }

      /* FAQ MATCH */
      const words = q.split(/\s+/).filter(w => w.length > 2);
      const results = AvantiWidget.faqs.filter(f => {
        const t = `${f.question} ${f.answer}`.toLowerCase();
        return words.filter(w => t.includes(w)).length >= 2;
      }).slice(0,3);

      if (results.length) {
        AvantiWidget.botState.unclearCount = 0;
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

      /* CONTROLLED FALLBACK */
      AvantiWidget.botState.unclearCount++;

      if (AvantiWidget.botState.unclearCount === 1) {
        messages.innerHTML += `
          <div class="avanti-msg bot">
            Can you clarify a bit more?
            Login, attendance, or curriculum?
          </div>`;
        return;
      }

      if (AvantiWidget.botState.unclearCount === 2) {
        messages.innerHTML += `
          <div class="avanti-msg bot">
            Please raise a ticket for detailed support.
          </div>
          <button class="avanti-action-btn primary"
            onclick="AvantiWidget.showForm()">🎫 Raise Ticket</button>`;
      }

    }, 600);
  };

})();
