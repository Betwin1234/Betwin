// VIP Payment Lock System
// Handles score locking, payment verification, and Firebase integration

const VIPSystem = {
    // Firebase reference for VIP scores
    vipScoresRef: null,
    
    // Current user's VIP status
    currentUserVIP: null,
    
    // Initialize VIP System
    init: function() {
        if (window.db) {
            this.vipScoresRef = window.db.ref('vipScores');
        }
        this.checkUserVIPStatus();
    },
    
    // Check if user is VIP and has paid
    checkUserVIPStatus: function() {
        const vipToken = localStorage.getItem('vip_token');
        const vipExpiry = localStorage.getItem('vip_expiry');
        
        if (vipToken && vipExpiry) {
            const expiryDate = new Date(vipExpiry);
            if (expiryDate > new Date()) {
                this.currentUserVIP = true;
                return true;
            }
        }
        
        this.currentUserVIP = false;
        return false;
    },
    
    // Show locked score interface
    showLockedScore: function(matchId, matchName) {
        const card = document.querySelector(`[data-match-id="${matchId}"]`);
        if (!card) return;
        
        const scoreElement = card.querySelector('.score-value');
        if (!scoreElement) return;
        
        // Hide actual score
        scoreElement.innerHTML = `
            <div class="locked-score">
                <i class="fas fa-lock lock-icon"></i>
                <p>Score Hidden</p>
                <button class="unlock-btn" onclick="VIPSystem.showPaymentModal('${matchId}', '${matchName}')">Unlock VIP Score</button>
            </div>
        `;
    },
    
    // Show payment verification modal
    showPaymentModal: function(matchId, matchName) {
        const modal = document.getElementById('vipPaymentModal');
        if (!modal) {
            this.createPaymentModal();
        }
        
        document.getElementById('vipPaymentModal').style.display = 'block';
        document.getElementById('selectedMatchId').value = matchId;
        document.getElementById('selectedMatchName').textContent = matchName;
        
        // Reset form
        document.getElementById('paymentForm').reset();
    },
    
    // Close payment modal
    closePaymentModal: function() {
        const modal = document.getElementById('vipPaymentModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    // Create payment modal HTML
    createPaymentModal: function() {
        const modalHTML = `
            <div class="modal" id="vipPaymentModal">
                <div class="modal-content payment-modal">
                    <span class="close" onclick="VIPSystem.closePaymentModal()">&times;</span>
                    <div class="payment-header">
                        <i class="fas fa-lock-open"></i>
                        <h3>Unlock VIP Score</h3>
                    </div>
                    
                    <div class="payment-match-info">
                        <p>Match: <strong id="selectedMatchName"></strong></p>
                    </div>
                    
                    <div class="payment-options">
                        <div class="payment-option">
                            <input type="radio" id="payment-once" name="paymentType" value="once" checked>
                            <label for="payment-once">
                                <span class="option-title">Single Match Unlock</span>
                                <span class="option-price">$2.99</span>
                            </label>
                        </div>
                        
                        <div class="payment-option">
                            <input type="radio" id="payment-daily" name="paymentType" value="daily">
                            <label for="payment-daily">
                                <span class="option-title">Daily VIP Access (24 Hours)</span>
                                <span class="option-price">$9.99</span>
                            </label>
                        </div>
                        
                        <div class="payment-option">
                            <input type="radio" id="payment-weekly" name="paymentType" value="weekly">
                            <label for="payment-weekly">
                                <span class="option-title">Weekly VIP Access (7 Days)</span>
                                <span class="option-price">$29.99</span>
                            </label>
                        </div>
                        
                        <div class="payment-option">
                            <input type="radio" id="payment-monthly" name="paymentType" value="monthly">
                            <label for="payment-monthly">
                                <span class="option-title">Monthly VIP Access (30 Days)</span>
                                <span class="option-price">$79.99</span>
                                <span class="option-badge">Best Value</span>
                            </label>
                        </div>
                    </div>
                    
                    <form id="paymentForm" onsubmit="VIPSystem.processPayment(event)">
                        <input type="hidden" id="selectedMatchId">
                        
                        <div class="form-group">
                            <label for="cardName">Full Name</label>
                            <input type="text" id="cardName" class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="cardEmail">Email Address</label>
                            <input type="email" id="cardEmail" class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="cardNumber">Card Number</label>
                            <input type="text" id="cardNumber" class="form-input" placeholder="1234 5678 9012 3456" maxlength="19" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="cardExpiry">Expiry Date</label>
                                <input type="text" id="cardExpiry" class="form-input" placeholder="MM/YY" maxlength="5" required>
                            </div>
                            <div class="form-group">
                                <label for="cardCVV">CVV</label>
                                <input type="text" id="cardCVV" class="form-input" placeholder="123" maxlength="3" required>
                            </div>
                        </div>
                        
                        <div class="payment-terms">
                            <input type="checkbox" id="agreeTerms" required>
                            <label for="agreeTerms">I agree to the payment terms and conditions</label>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-payment">Complete Payment</button>
                    </form>
                    
                    <div class="payment-security">
                        <i class="fas fa-shield-alt"></i>
                        <p>Your payment is secure and encrypted</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupPaymentInputs();
    },
    
    // Setup payment input formatting
    setupPaymentInputs: function() {
        // Card number formatting
        const cardInput = document.getElementById('cardNumber');
        if (cardInput) {
            cardInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\s/g, '');
                let formattedValue = value.replace(/(\d{4})/g, '$1 ').trim();
                e.target.value = formattedValue;
            });
        }
        
        // Expiry date formatting
        const expiryInput = document.getElementById('cardExpiry');
        if (expiryInput) {
            expiryInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                }
                e.target.value = value;
            });
        }
        
        // CVV input
        const cvvInput = document.getElementById('cardCVV');
        if (cvvInput) {
            cvvInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }
    },
    
    // Process payment
    processPayment: function(event) {
        event.preventDefault();
        
        const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
        const matchId = document.getElementById('selectedMatchId').value;
        const email = document.getElementById('cardEmail').value;
        
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Simulate payment processing (in production, integrate with Stripe/PayPal)
        setTimeout(() => {
            this.verifyPaymentAndUnlock(paymentType, matchId, email, submitBtn, originalText);
        }, 2000);
    },
    
    // Verify payment and unlock score
    verifyPaymentAndUnlock: function(paymentType, matchId, email, submitBtn, originalText) {
        // Set VIP token and expiry based on payment type
        const now = new Date();
        let expiryDate = new Date(now);
        
        switch(paymentType) {
            case 'daily':
                expiryDate.setDate(expiryDate.getDate() + 1);
                break;
            case 'weekly':
                expiryDate.setDate(expiryDate.getDate() + 7);
                break;
            case 'monthly':
                expiryDate.setDate(expiryDate.getDate() + 30);
                break;
            case 'once':
                expiryDate.setDate(expiryDate.getDate() + 1); // 24 hour access for single match
                break;
        }
        
        // Generate token
        const token = 'vip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Store in localStorage
        localStorage.setItem('vip_token', token);
        localStorage.setItem('vip_expiry', expiryDate.toISOString());
        localStorage.setItem('vip_payment_type', paymentType);
        localStorage.setItem('vip_user_email', email);
        
        // Store payment record in Firebase
        if (this.vipScoresRef) {
            const paymentRef = window.db.ref('payments').push();
            paymentRef.set({
                email: email,
                paymentType: paymentType,
                matchId: matchId,
                amount: this.getPaymentAmount(paymentType),
                timestamp: new Date().toISOString(),
                status: 'verified',
                token: token
            });
        }
        
        // Update UI
        this.currentUserVIP = true;
        
        // Show success message
        this.showSuccessMessage(submitBtn, originalText);
        
        // Reveal score
        setTimeout(() => {
            this.revealScore(matchId);
            this.closePaymentModal();
        }, 1500);
    },
    
    // Get payment amount
    getPaymentAmount: function(paymentType) {
        const amounts = {
            'once': 2.99,
            'daily': 9.99,
            'weekly': 29.99,
            'monthly': 79.99
        };
        return amounts[paymentType] || 0;
    },
    
    // Show success message
    showSuccessMessage: function(btn, originalText) {
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Payment Successful!';
        btn.style.backgroundColor = '#10b981';
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
        }, 2000);
    },
    
    // Reveal score after successful payment
    revealScore: function(matchId) {
        if (this.vipScoresRef) {
            this.vipScoresRef.child(matchId).once('value', (snapshot) => {
                const scoreData = snapshot.val();
                if (scoreData) {
                    const card = document.querySelector(`[data-match-id="${matchId}"]`);
                    if (card) {
                        const scoreElement = card.querySelector('.score-value');
                        if (scoreElement) {
                            scoreElement.innerHTML = `
                                <div class="revealed-score">
                                    <p class="score-unlocked-badge">✓ VIP Unlocked</p>
                                    <p class="score-text">${scoreData.score}</p>
                                    <p class="score-confidence">Confidence: ${scoreData.confidence}%</p>
                                </div>
                            `;
                        }
                    }
                }
            });
        }
    },
    
    // Load VIP scores from Firebase
    loadVIPScores: function(callback) {
        if (!this.vipScoresRef) {
            console.log('Firebase not initialized');
            return;
        }
        
        this.vipScoresRef.once('value', (snapshot) => {
            const scores = {};
            snapshot.forEach((childSnapshot) => {
                scores[childSnapshot.key] = childSnapshot.val();
            });
            if (callback) callback(scores);
        });
    },
    
    // Get specific score
    getScore: function(matchId, callback) {
        if (!this.vipScoresRef) {
            console.log('Firebase not initialized');
            return;
        }
        
        this.vipScoresRef.child(matchId).once('value', (snapshot) => {
            if (callback) callback(snapshot.val());
        });
    },
    
    // Add score (admin)
    addScore: function(matchId, scoreData, callback) {
        if (!this.vipScoresRef) {
            console.log('Firebase not initialized');
            return;
        }
        
        this.vipScoresRef.child(matchId).set(scoreData, (error) => {
            if (error) {
                console.error('Error adding score:', error);
                if (callback) callback(false, error);
            } else {
                console.log('Score added successfully');
                if (callback) callback(true);
            }
        });
    },
    
    // Update score (admin)
    updateScore: function(matchId, scoreData, callback) {
        if (!this.vipScoresRef) {
            console.log('Firebase not initialized');
            return;
        }
        
        this.vipScoresRef.child(matchId).update(scoreData, (error) => {
            if (error) {
                console.error('Error updating score:', error);
                if (callback) callback(false, error);
            } else {
                console.log('Score updated successfully');
                if (callback) callback(true);
            }
        });
    },
    
    // Delete score (admin)
    deleteScore: function(matchId, callback) {
        if (!this.vipScoresRef) {
            console.log('Firebase not initialized');
            return;
        }
        
        this.vipScoresRef.child(matchId).remove((error) => {
            if (error) {
                console.error('Error deleting score:', error);
                if (callback) callback(false, error);
            } else {
                console.log('Score deleted successfully');
                if (callback) callback(true);
            }
        });
    }
};

// Initialize VIP System when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        VIPSystem.init();
    });
} else {
    VIPSystem.init();
}
