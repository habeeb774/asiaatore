import React, { useState } from 'react';
import { useExperiment } from '../../../contexts/ExperimentContext';
import Seo from '../../../components/Seo';

const ExperimentsPage = () => {
  const { 
    experiments, 
    userVariants, 
    events, 
    toggleExperiment, 
    updateExperiment, 
    getExperimentStats,
    trackEvent 
  } = useExperiment();

  const [showEvents, setShowEvents] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);

  const handleToggleExperiment = (experimentId) => {
    toggleExperiment(experimentId, !experiments[experimentId].enabled);
    trackEvent('experiment_toggled', { experimentId, enabled: !experiments[experimentId].enabled });
  };

  const handleWeightChange = (experimentId, variantIndex, newWeight) => {
    const experiment = experiments[experimentId];
    const newWeights = [...experiment.weights];
    newWeights[variantIndex] = Number(newWeight);
    
    // Normalize weights to sum to 100
    const total = newWeights.reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = newWeights.map(weight => Math.round((weight / total) * 100));
    
    updateExperiment(experimentId, { weights: normalizedWeights });
    trackEvent('experiment_weights_changed', { experimentId, weights: normalizedWeights });
  };

  const getStats = (experimentId) => {
    const stats = getExperimentStats(experimentId);
    if (!stats) return null;

    const totalConversions = Object.values(stats.variants).reduce(
      (sum, variant) => sum + variant.conversions, 
      0
    );

    return {
      ...stats,
      totalConversions,
      conversionRates: Object.entries(stats.variants).reduce((rates, [variant, data]) => {
        rates[variant] = data.events > 0 ? ((data.conversions / data.events) * 100).toFixed(2) : '0.00';
        return rates;
      }, {})
    };
  };

  return (
    <div className="experiments-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Seo title="Experiments Dashboard" description="Manage A/B tests and feature flags" />
      
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '10px' }}>
          🧪 Experiments Dashboard
        </h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Manage A/B tests and feature flags for your store
        </p>
      </div>

      {/* Current User Variants */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '30px' 
      }}>
        <h3 style={{ marginBottom: '10px' }}>👤 Your Current Variants</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {Object.entries(userVariants).map(([experimentId, variant]) => (
            <div key={experimentId} style={{ 
              background: 'white', 
              padding: '8px 12px', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              fontSize: '14px'
            }}>
              <strong>{experimentId}:</strong> {variant}
            </div>
          ))}
          {Object.keys(userVariants).length === 0 && (
            <span style={{ color: '#666' }}>No experiments assigned yet</span>
          )}
        </div>
      </div>

      {/* Experiments List */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px' }}>🎛️ Active Experiments</h2>
        <div style={{ display: 'grid', gap: '20px' }}>
          {Object.entries(experiments).map(([experimentId, experiment]) => {
            const stats = getStats(experimentId);
            
            return (
              <div key={experimentId} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '20px',
                background: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>{experimentId}</h3>
                    <p style={{ color: '#666', margin: '0', fontSize: '14px' }}>
                      {experiment.description}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      background: experiment.enabled ? '#d4edda' : '#f8d7da',
                      color: experiment.enabled ? '#155724' : '#721c24'
                    }}>
                      {experiment.enabled ? '✅ Active' : '❌ Inactive'}
                    </span>
                    <button
                      onClick={() => handleToggleExperiment(experimentId)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        background: experiment.enabled ? '#dc3545' : '#28a745',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {experiment.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>

                {/* Variants and Weights */}
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Variants & Weights:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {experiment.variants.map((variant, index) => (
                      <div key={variant} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '14px', minWidth: '80px' }}>{variant}:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={experiment.weights[index]}
                          onChange={(e) => handleWeightChange(experimentId, index, e.target.value)}
                          disabled={!experiment.enabled}
                          style={{ 
                            width: '60px', 
                            padding: '4px', 
                            border: '1px solid #ddd', 
                            borderRadius: '4px',
                            opacity: experiment.enabled ? 1 : 0.5
                          }}
                        />
                        <span style={{ fontSize: '12px', color: '#666' }}>%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Statistics */}
                {stats && (
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>📊 Statistics:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                      <div>
                        <strong>Total Events:</strong> {stats.totalEvents}
                      </div>
                      <div>
                        <strong>Conversions:</strong> {stats.totalConversions}
                      </div>
                      {Object.entries(stats.variants).map(([variant, data]) => (
                        <div key={variant}>
                          <strong>{variant}:</strong> {data.events} events, {data.conversions} conversions 
                          ({stats.conversionRates[variant]}%)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reports Section */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px' }}>📈 Experiment Reports</h2>
        
        {Object.entries(experiments).filter(([_, exp]) => exp.enabled).length === 0 ? (
          <div style={{ 
            background: '#fff3cd', 
            padding: '15px', 
            borderRadius: '8px', 
            border: '1px solid #ffeaa7',
            color: '#856404'
          }}>
            ⚠️ No active experiments to report. Enable some experiments to see reports here.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white', 
                padding: '20px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {Object.keys(experiments).length}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Experiments</div>
              </div>
              
              <div style={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
                color: 'white', 
                padding: '20px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {Object.values(experiments).filter(exp => exp.enabled).length}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Experiments</div>
              </div>
              
              <div style={{ 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
                color: 'white', 
                padding: '20px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {events.length}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Events</div>
              </div>
              
              <div style={{ 
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
                color: 'white', 
                padding: '20px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {events.filter(e => e.name === 'add_to_cart').length}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Conversions</div>
              </div>
            </div>

            {/* Detailed Reports */}
            {Object.entries(experiments).filter(([_, exp]) => exp.enabled).map(([experimentId, experiment]) => {
              const stats = getStats(experimentId);
              if (!stats) return null;

              const totalConversions = Object.values(stats.variants).reduce(
                (sum, variant) => sum + variant.conversions, 
                0
              );

              const winningVariant = Object.entries(stats.variants).reduce((winner, [variant, data]) => {
                if (!winner || data.conversions > winner.conversions) {
                  return { variant, conversions: data.conversions, events: data.events };
                }
                return winner;
              }, null);

              return (
                <div key={experimentId} style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '20px',
                  background: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: '0' }}>{experimentId} Report</h3>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      background: '#e3f2fd',
                      color: '#1976d2'
                    }}>
                      📊 {stats.totalEvents} events
                    </span>
                  </div>

                  {/* Performance Summary */}
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '4px',
                    marginBottom: '15px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>🏆 Performance Summary</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <div>
                        <strong>Winning Variant:</strong> {winningVariant?.variant || 'N/A'}
                      </div>
                      <div>
                        <strong>Conversion Rate:</strong> {winningVariant?.events > 0 ? 
                          ((winningVariant.conversions / winningVariant.events) * 100).toFixed(2) : '0.00'}%
                      </div>
                      <div>
                        <strong>Total Conversions:</strong> {totalConversions}
                      </div>
                    </div>
                  </div>

                  {/* Variant Comparison */}
                  <div>
                    <h4 style={{ margin: '0 0 10px 0' }}>📊 Variant Comparison</h4>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {Object.entries(stats.variants).map(([variant, data]) => {
                        const conversionRate = data.events > 0 ? (data.conversions / data.events) * 100 : 0;
                        const isWinner = winningVariant?.variant === variant;
                        
                        return (
                          <div key={variant} style={{ 
                            border: `2px solid ${isWinner ? '#4caf50' : '#ddd'}`, 
                            borderRadius: '4px', 
                            padding: '12px',
                            background: isWinner ? '#f1f8e9' : 'white',
                            position: 'relative'
                          }}>
                            {isWinner && (
                              <span style={{ 
                                position: 'absolute', 
                                top: '-10px', 
                                right: '10px',
                                background: '#4caf50',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}>
                                WINNER
                              </span>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong>{variant}</strong>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                  {data.events} events, {data.conversions} conversions
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: isWinner ? '#4caf50' : '#333' }}>
                                  {conversionRate.toFixed(2)}%
                                </div>
                                <div style={{ fontSize: '11px', color: '#666' }}>conversion rate</div>
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div style={{ 
                              marginTop: '8px', 
                              height: '6px', 
                              background: '#e0e0e0', 
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{ 
                                height: '100%', 
                                width: `${conversionRate}%`,
                                background: isWinner ? '#4caf50' : '#2196f3',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div style={{ 
                    background: '#e8f5e8', 
                    padding: '15px', 
                    borderRadius: '4px',
                    marginTop: '15px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>💡 Recommendations</h4>
                    <ul style={{ margin: '0', paddingLeft: '20px', color: '#2e7d32' }}>
                      {totalConversions === 0 && (
                        <li>Not enough data yet. Wait for more user interactions.</li>
                      )}
                      {winningVariant && winningVariant.conversions > 0 && (
                        <li>
                          Consider making <strong>{winningVariant.variant}</strong> the default if it continues to outperform.
                        </li>
                      )}
                      {Object.values(stats.variants).some(v => v.events === 0) && (
                        <li>Some variants have no traffic. Consider adjusting weights or running the experiment longer.</li>
                      )}
                      {stats.totalEvents < 100 && (
                        <li>Need more events (aim for at least 100) for statistically significant results.</li>
                      )}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Events Log */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>📋 Recent Events</h2>
          <button
            onClick={() => setShowEvents(!showEvents)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              background: '#007bff',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {showEvents ? 'Hide' : 'Show'} Events ({events.length})
          </button>
        </div>

        {showEvents && (
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            background: 'white',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            {events.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No events recorded yet
              </div>
            ) : (
              <div style={{ fontSize: '14px' }}>
                {events.slice().reverse().map((event) => (
                  <div key={event.id} style={{ 
                    borderBottom: '1px solid #eee', 
                    padding: '10px 15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start'
                  }}>
                    <div>
                      <strong>{event.name}</strong>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                      {event.data.variants && (
                        <div style={{ fontSize: '12px', color: '#333', marginTop: '2px' }}>
                          Variants: {JSON.stringify(event.data.variants)}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {event.data.productId && `Product: ${event.data.productId}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExperimentsPage;
