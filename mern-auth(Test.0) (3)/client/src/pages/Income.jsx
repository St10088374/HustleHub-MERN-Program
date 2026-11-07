import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';

const TAX_RATE = 0.27;

const Income = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        const { data: res } = await API.get('/transactions/my');
        setData(res);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load income data.');
      } finally {
        setLoading(false);
      }
    };
    fetchIncome();
  }, []);

  const formatCurrency = (amount) =>
    `R${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-ZA', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-content">
        <div className="page-header">
          <h1>Income & Tax Overview</h1>
          <p>Track your earnings and estimated tax obligations.</p>
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <div className="income-summary-grid">
              <div className="income-card">
                <div className="action-card-header">
                  <div className="action-icon-bubble emerald">
                    <span>💵</span>
                  </div>
                  <span className="income-card-label">Gross Revenue</span>
                </div>
                <div className="income-card-value green">{formatCurrency(data.summary.totalIncome)}</div>
                <div className="income-card-sub">{data.summary.transactionCount} completed booking{data.summary.transactionCount !== 1 ? 's' : ''}</div>
              </div>

              <div className="income-card">
                <div className="action-card-header">
                  <div className="action-icon-bubble cyan">
                    <span>🏛️</span>
                  </div>
                  <span className="income-card-label">Tax Withholding</span>
                </div>
                <div className="income-card-value red">{formatCurrency(data.summary.totalEstimatedTax)}</div>
                <div className="income-card-sub">{(TAX_RATE * 100).toFixed(0)}% provisional reference rate</div>
              </div>

              <div className="income-card highlighted">
                <div className="action-card-header">
                  <div className="action-icon-bubble violet">
                    <span>✨</span>
                  </div>
                  <span className="income-card-label">Net Take-Home</span>
                </div>
                <div className="income-card-value">{formatCurrency(data.summary.totalNetIncome)}</div>
                <div className="income-card-sub">Disbursable profit after estimated tax</div>
              </div>
            </div>

            {/* Tax Disclaimer & Logic */}
            <div className="tax-note">
              <strong>⚠️ Tax Estimation Logic & Disclaimer:</strong> Under South African provisional tax guidelines for independent freelancers, tax is estimated at a standard <strong>27% corporate/provisional reference rate</strong> on gross marketplace revenue: 
              <code> Estimated Tax = Gross Amount × 0.27</code>. This figure represents an illustrative provisional reserve. Consult an accredited South African tax practitioner for personalized tax filing.
            </div>

            {/* Visual Charts & Financial Breakdown */}
            {data.transactions.length > 0 && (
              <div className="analytics-card mb-8">
                <div className="analytics-card-header">
                  <div className="action-icon-bubble violet">
                    <span>📊</span>
                  </div>
                  <div>
                    <h3>Income & Tax Distribution Visualisation</h3>
                    <p className="text-secondary text-sm">Visual breakdown of net earnings versus provisional tax allocation</p>
                  </div>
                </div>

                {/* Ratio Bar */}
                <div className="allocation-bar-section">
                  <div className="allocation-bar-labels">
                    <span className="allocation-label text-emerald">
                      ● Net Take-Home: <strong>73%</strong> ({formatCurrency(data.summary.totalNetIncome)})
                    </span>
                    <span className="allocation-label text-amber">
                      ● Tax Reserve: <strong>27%</strong> ({formatCurrency(data.summary.totalEstimatedTax)})
                    </span>
                  </div>
                  <div className="allocation-bar-track">
                    <div className="allocation-bar-fill fill-emerald" style={{ width: '73%' }} title="Net Income: 73%" />
                    <div className="allocation-bar-fill fill-amber" style={{ width: '27%' }} title="Estimated Tax: 27%" />
                  </div>
                </div>

                {/* Monthly Bar Chart */}
                <div className="monthly-chart-section">
                  <h4 className="chart-subtitle">Monthly Financial Trend</h4>
                  <div className="chart-bars-container">
                    {(() => {
                      const monthly = data.transactions.reduce((acc, t) => {
                        const m = new Date(t.createdAt).toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
                        if (!acc[m]) acc[m] = { gross: 0, tax: 0, net: 0 };
                        acc[m].gross += t.amount;
                        acc[m].tax += t.estimatedTax;
                        acc[m].net += t.netAmount;
                        return acc;
                      }, {});
                      const entries = Object.entries(monthly);
                      const maxVal = Math.max(...entries.map(([, v]) => v.gross), 100);

                      return entries.map(([monthKey, val]) => (
                        <div key={monthKey} className="chart-bar-group">
                          <div className="chart-bar-columns">
                            <div 
                              className="bar-col bar-gross" 
                              style={{ height: `${Math.max(12, (val.gross / maxVal) * 140)}px` }}
                              title={`Gross: ${formatCurrency(val.gross)}`}
                            />
                            <div 
                              className="bar-col bar-net" 
                              style={{ height: `${Math.max(10, (val.net / maxVal) * 140)}px` }}
                              title={`Net: ${formatCurrency(val.net)}`}
                            />
                            <div 
                              className="bar-col bar-tax" 
                              style={{ height: `${Math.max(6, (val.tax / maxVal) * 140)}px` }}
                              title={`Tax (27%): ${formatCurrency(val.tax)}`}
                            />
                          </div>
                          <span className="chart-month-label">{monthKey}</span>
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="chart-legend">
                    <span className="legend-item"><span className="legend-dot bg-indigo"></span> Gross Revenue</span>
                    <span className="legend-item"><span className="legend-dot bg-emerald"></span> Net Take-Home</span>
                    <span className="legend-item"><span className="legend-dot bg-amber"></span> Tax Withholding (27%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            <div className="transactions-section">
              <h2>Transaction History</h2>
              {data.transactions.length === 0 ? (
                <div className="empty-state"><p>No transactions yet. Start getting bookings!</p></div>
              ) : (
                <div className="transactions-table-wrapper">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Gig</th>
                        <th>Client</th>
                        <th>Gross</th>
                        <th>Tax (27%)</th>
                        <th>Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.transactions.map((t) => (
                        <tr key={t._id}>
                          <td>{formatDate(t.createdAt)}</td>
                          <td className="td-gig">{t.gig?.title}</td>
                          <td>{t.client?.name}</td>
                          <td className="td-amount">{formatCurrency(t.amount)}</td>
                          <td className="td-tax">-{formatCurrency(t.estimatedTax)}</td>
                          <td className="td-net">{formatCurrency(t.netAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="totals-row">
                        <td colSpan={3}><strong>Totals</strong></td>
                        <td className="td-amount"><strong>{formatCurrency(data.summary.totalIncome)}</strong></td>
                        <td className="td-tax"><strong>-{formatCurrency(data.summary.totalEstimatedTax)}</strong></td>
                        <td className="td-net"><strong>{formatCurrency(data.summary.totalNetIncome)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default Income;
