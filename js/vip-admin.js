// VIP Admin Panel - Manage VIP Scores
// Handles adding, editing, and deleting VIP scores from Firebase

const VIPAdmin = {
    currentEditingId: null,
    scores: {},
    
    // Initialize Admin Panel
    init: function() {
        this.loadScores();
        this.setupEventListeners();
    },
    
    // Load all VIP scores
    loadScores: function() {
        const scoresList = document.getElementById('vipScoresList');
        if (!scoresList) return;
        
        VIPSystem.loadVIPScores((scores) => {
            this.scores = scores;
            this.displayScores();
        });
    },
    
    // Display scores in admin table
    displayScores: function() {
        const scoresList = document.getElementById('vipScoresList');
        if (!scoresList) return;
        
        if (Object.keys(this.scores).length === 0) {
            scoresList.innerHTML = '<p class="no-data">No VIP scores added yet.</p>';
            return;
        }
        
        let html = `
            <div class="admin-table">
                <div class="table-header">
                    <div class="table-cell">Match ID</div>
                    <div class="table-cell">Score</div>
                    <div class="table-cell">Confidence</div>
                    <div class="table-cell">Match Time</div>
                    <div class="table-cell">Actions</div>
                </div>
        `;
        
        for (const [matchId, score] of Object.entries(this.scores)) {
            html += `
                <div class="table-row">
                    <div class="table-cell">${this.escapeHtml(matchId)}</div>
                    <div class="table-cell">${this.escapeHtml(score.score || '-')}</div>
                    <div class="table-cell">${score.confidence || 0}%</div>
                    <div class="table-cell">${this.formatDate(score.matchTime)}</div>
                    <div class="table-cell actions">
                        <button class="btn-sm btn-edit" onclick="VIPAdmin.openEditModal('${matchId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-sm btn-delete" onclick="VIPAdmin.deleteScore('${matchId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        scoresList.innerHTML = html;
    },
    
    // Open modal to add/edit score
    openAddScoreModal: function() {
        this.currentEditingId = null;
        this.resetForm();
        document.getElementById('vipScoreModalTitle').textContent = 'Add VIP Score';
        document.getElementById('vipScoreModal').style.display = 'block';
    },
    
    // Open modal to edit score
    openEditModal: function(matchId) {
        this.currentEditingId = matchId;
        const score = this.scores[matchId];
        
        document.getElementById('vipScoreMatchId').value = matchId;
        document.getElementById('vipScoreValue').value = score.score || '';
        document.getElementById('vipScoreConfidence').value = score.confidence || 0;
        document.getElementById('vipScoreMatchTime').value = score.matchTime || '';
        document.getElementById('vipScoreAnalysis').value = score.analysis || '';
        
        document.getElementById('vipScoreModalTitle').textContent = 'Edit VIP Score';
        document.getElementById('vipScoreModal').style.display = 'block';
    },
    
    // Close modal
    closeScoreModal: function() {
        document.getElementById('vipScoreModal').style.display = 'none';
        this.resetForm();
    },
    
    // Reset form
    resetForm: function() {
        document.getElementById('vipScoreForm').reset();
        this.currentEditingId = null;
    },
    
    // Save score
    saveScore: function(event) {
        event.preventDefault();
        
        const matchId = document.getElementById('vipScoreMatchId').value;
        const score = document.getElementById('vipScoreValue').value;
        const confidence = document.getElementById('vipScoreConfidence').value;
        const matchTime = document.getElementById('vipScoreMatchTime').value;
        const analysis = document.getElementById('vipScoreAnalysis').value;
        
        if (!matchId || !score) {
            alert('Please fill in all required fields');
            return;
        }
        
        const scoreData = {
            score: score,
            confidence: parseInt(confidence),
            matchTime: matchTime,
            analysis: analysis,
            addedAt: new Date().toISOString()
        };
        
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        if (this.currentEditingId) {
            // Update existing score
            VIPSystem.updateScore(matchId, scoreData, (success) => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                
                if (success) {
                    this.closeScoreModal();
                    this.loadScores();
                    this.showNotification('Score updated successfully!', 'success');
                } else {
                    this.showNotification('Error updating score', 'error');
                }
            });
        } else {
            // Add new score
            VIPSystem.addScore(matchId, scoreData, (success) => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                
                if (success) {
                    this.closeScoreModal();
                    this.loadScores();
                    this.showNotification('Score added successfully!', 'success');
                } else {
                    this.showNotification('Error adding score', 'error');
                }
            });
        }
    },
    
    // Delete score with confirmation
    deleteScore: function(matchId) {
        if (confirm(`Delete score for match ${matchId}?`)) {
            VIPSystem.deleteScore(matchId, (success) => {
                if (success) {
                    this.loadScores();
                    this.showNotification('Score deleted successfully!', 'success');
                } else {
                    this.showNotification('Error deleting score', 'error');
                }
            });
        }
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        const form = document.getElementById('vipScoreForm');
        if (form) {
            form.addEventListener('submit', (e) => this.saveScore(e));
        }
    },
    
    // Show notification
    showNotification: function(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    // Utility functions
    escapeHtml: function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },
    
    formatDate: function(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        VIPAdmin.init();
    });
} else {
    VIPAdmin.init();
}
