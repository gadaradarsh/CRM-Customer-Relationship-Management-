import React from 'react';

const ProgressIndicator = ({ current, target, label, color = 'blue', showPercentage = true }) => {
  const percentage = Math.min((current / target) * 100, 100);
  
  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600'
    };
    return colors[color] || colors.blue;
  };

  const getMotivationalMessage = (percentage) => {
    if (percentage >= 100) return '🎉 Goal achieved!';
    if (percentage >= 80) return '🔥 Almost there!';
    if (percentage >= 60) return '💪 Great progress!';
    if (percentage >= 40) return '📈 Keep going!';
    if (percentage >= 20) return '🚀 Getting started!';
    return '💡 Ready to begin?';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {showPercentage && (
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      
      <div className="progress-bar mb-2">
        <div 
          className={`progress-fill bg-gradient-to-r ${getColorClasses(color)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>{current} of {target}</span>
        <span className="font-medium">{getMotivationalMessage(percentage)}</span>
      </div>
    </div>
  );
};

export default ProgressIndicator;
