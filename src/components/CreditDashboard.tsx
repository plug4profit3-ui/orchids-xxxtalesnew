import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import * as creditService from '../services/creditService';
import { formatCredits, isLowBalance, isCriticalBalance } from '../services/creditService';

interface CreditDashboardProps {
  user: UserProfile;
  onTopUp: (packageId: string) => void;
  onRefresh: () => void;
  onNavigateToChat: () => void;
}

export const CreditDashboard: React.FC<CreditDashboardProps> = ({
  user,
  onTopUp,
  onRefresh,
  onNavigateToChat,
}) => {
  const [balance, setBalance] = useState<number>(user.credits || 0);
  const [dailyMessagesLeft, setDailyMessagesLeft] = useState<number>(user.dailyMessagesLeft || 10);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<creditService.CreditTransaction[]>([]);
  const [packages, setPackages] = useState<creditService.CreditPackage[]>([]);
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Check balance status
  useEffect(() => {
    if (isCriticalBalance(balance)) {
      setShowLowBalanceWarning(true);
    } else if (isLowBalance(balance)) {
      setShowLowBalanceWarning(true);
    }
  }, [balance]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get balance
      const balanceData = await creditService.getCreditBalance();
      setBalance(balanceData.balance);
      setDailyMessagesLeft(balanceData.daily_messages_left);

      // Get transactions
      const transactionsData = await creditService.getTransactions(10, 0);
      setTransactions(transactionsData.transactions);

      // Get packages
      const packagesData = await creditService.getCreditPackages();
      setPackages(packagesData.packages);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = (packageId: string) => {
    onTopUp(packageId);
  };

  const handleRefresh = () => {
    onRefresh();
  };

  const getBalanceStatus = () => {
    if (balance >= 100) {
      return { color: 'success', icon: '✅' };
    } else if (balance >= 10) {
      return { color: 'warning', icon: '⚠️' };
    } else {
      return { color: 'critical', icon: '🚨' };
    }
  };

  const balanceStatus = getBalanceStatus();

  return (
    <div className="credit-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>💰 Credits Dashboard</h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Balance Card */}
      <div className="balance-card balance-status-${balanceStatus.color}">
        <div className="balance-header">
          <span className="balance-label">Current Balance</span>
          <span className="balance-icon">{balanceStatus.icon}</span>
        </div>
        <div className="balance-amount">${(balance / 100).toFixed(2)}</div>
        <div className="balance-subtext">
          ≈ {formatCredits(balance)} messages
        </div>
        <div className="balance-footer">
          <button
            onClick={() => setShowLowBalanceWarning(true)}
          >
            Top Up Now
          </button>
        </div>
      </div>

      {/* Daily Messages */}
      <div className="daily-messages-card">
        <div className="daily-header">
          <span className="daily-label">Daily Messages</span>
          <span className="daily-count">
            {dailyMessagesLeft} / 10 left
          </span>
        </div>
        <div className="daily-progress">
          <div
            className="progress-bar"
            style={{ width: `${(dailyMessagesLeft / 10) * 100}%` }}
          >
            <span className="progress-text">{dailyMessagesLeft} messages left</span>
          </div>
        </div>
      </div>

      {/* Packages */}
      <div className="packages-section">
        <h2>Available Packages</h2>
        <div className="packages-grid">
          {packages.map((pkg) => (
            <div key={pkg.id} className="package-card">
              <div className="package-header">
            <div className="package-title">{pkg.name}</div>
            <div className="package-price">${(pkg.price_eur / 100).toFixed(2)}</div>
            </div>
            <div className="package-body">
              <div className="package-credits">+{pkg.credits_amount} credits</div>
              <div className="package-estimated">≈ {pkg.estimated_messages} messages</div>
            </div>
            <div className="package-footer">
              <button
              onClick={() => handleTopUp(pkg.id)}
              className="buy-btn"
              >
              Buy Now
              </button>
            </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="transactions-section">
        <h2>Recent Transactions</h2>
        <div className="transactions-list">
          {transactions.map((tx) => (
            <div key={tx.id} className="transaction-item">
              <div className="transaction-type">{tx.type}</div>
              <div className="transaction-amount">{tx.amount > 0 ? '+' : ''}{tx.amount}</div>
              <div className="transaction-time">{tx.created_at}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Balance Warning Modal */}
      {showLowBalanceWarning && (
        <div className="low-balance-modal">
              <div className="low-balance-content">
                <h2>⚠️ Low Balance Warning</h2>
                <p>Je hebt nog maar ${(balance / 100).toFixed(2)} credits over.</p>
            <p>Koop meer credits om door te gaan!</p>
                <div className="low-balance-actions">
                  <button
                    onClick={() => setShowLowBalanceWarning(false)}
                    className="cancel-btn"
                  >
                    Cancel</button>
                  <button
                    onClick={() => {
                      setShowLowBalanceWarning(false);
                    }}
                    className="top-up-btn"
                  >
                    Top Up Now</button>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default CreditDashboard;
