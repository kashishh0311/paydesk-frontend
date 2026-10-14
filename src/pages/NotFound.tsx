import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { FileQuestion, ArrowLeft, Home, ShieldAlert } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 min-h-[500px] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-5 p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xs animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-inner">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 font-mono">
            404 ERROR
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto leading-relaxed">
            The destination you requested does not exist, has been relocated, or is unavailable in your workspace.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/dashboard')}
            leftIcon={<Home className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Previous Page
          </Button>
        </div>

        <div className="pt-4 border-t border-border/60 text-[11px] text-muted flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-primary" />
          <span>PayDesk HRMS Enterprise Compensation System</span>
        </div>
      </div>
    </div>
  );
};
