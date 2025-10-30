
import React from 'react';

interface SummaryCardProps {
  title: string;
  amount: number;
  color?: 'pink' | 'slate' | 'green' | 'blue' | 'purple';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  isSummarySection?: boolean;
  customAmountColor?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, color = 'slate', icon, children, isSummarySection = false, customAmountColor }) => {
  const backgroundColor = isSummarySection ? '#F4E7C8' : '#8E8892';
  const borderColor = isSummarySection ? '#E5D4B1' : '#7A7580';
  const textColor = isSummarySection ? '#746155' : '#F4E7C8';
  const amountColor = customAmountColor || (isSummarySection ? '#566C8D' : textColor);
  
  return (
    <div className="border rounded-lg p-4 h-full flex flex-col" style={{backgroundColor, borderColor}}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold font-kaisei" style={{color: textColor}}>{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-bold mb-2" style={{color: amountColor}}>
        ¥{amount.toLocaleString()}
      </p>
      {children && <div className="mt-auto pt-2">{children}</div>}
    </div>
  );
};

export default SummaryCard;
