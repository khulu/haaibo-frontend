import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/button/Button';
import getAuth from '@hooks/api/useAuthApi';

const baseURL = import.meta.env.VITE_API_BASE_URL;

export default function CheckinPage() {
  const { markerId } = useParams<{ markerId: string }>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'unauth'>('idle');
  const [message, setMessage] = useState<string>('');
  const [checkedIn, setCheckedIn] = useState(false);


  const token = getAuth().getToken();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!markerId) {
      setStatus('error');
      setMessage('Invalid QR code.');
      return;
    }
    // Silent auth: if no token, redirect to login and back
    if (!token) {
      setStatus('unauth');
      setTimeout(() => {
        navigate(`/signin?redirect=${encodeURIComponent(location.pathname)}`);
      }, 1200);
      return;
    }
    const checkin = async () => {
      setStatus('loading');
      try {
        const res = await fetch(`${baseURL}/reservations/checkin/${markerId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.status === 204 || res.status === 200) {
          setStatus('success');
          setMessage('Check-in successful!');
          setCheckedIn(true);
      
        } else if (res.status === 400) {
          setStatus('error');
          setMessage('Check-in failed: too early, reservation ended, or bad request.');
        } else if (res.status === 404) {
          setStatus('error');
          setMessage('No reservation found for this user and marker today.');
        } else if (res.status === 401) {
          setStatus('unauth');
          setMessage('Not authenticated. Redirecting to login...');
          setTimeout(() => {
            navigate(`/signin?redirect=${encodeURIComponent(location.pathname)}`);
          }, 1200);
        } else if (res.status === 403) {
          setStatus('error');
          setMessage('Forbidden. You do not have permission to check in.');
        } else {
          let errMsg = 'Check-in failed.';
          try {
            const text = await res.text();
            if (text) {
              const err = JSON.parse(text);
              errMsg = err.message || errMsg;
            }
          } catch {
            // intentionally ignore JSON parse errors
          }
          setStatus('error');
          setMessage(errMsg);
        }
      } catch (e: unknown) {
        setStatus('error');
        if (e instanceof Error) {
          setMessage(e.message || 'Check-in failed');
        } else {
          setMessage('Check-in failed');
        }
      }
    };
    checkin();
  }, [markerId, token, navigate, location]);

  const handleCheckout = async () => {
    setStatus('loading');
    try {
      const res = await fetch(`${baseURL}/reservations/checkout/${markerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 204 || res.status === 200) {
        setStatus('success');
        setMessage('Check-out successful!');
        setCheckedIn(false);
      } else {
        let errMsg = 'Check-out failed.';
        try {
          const text = await res.text();
          if (text) {
            const err = JSON.parse(text);
            errMsg = err.message || errMsg;
          }
        } catch {
          // intentionally ignore JSON parse errors
        }
        setStatus('error');
        setMessage(errMsg);
      }
    } catch (e: unknown) {
      setStatus('error');
      if (e instanceof Error) {
        setMessage(e.message || 'Check-out failed');
      } else {
        setMessage('Check-out failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white/90">QR Check-in</h2>
        {status === 'loading' && <div className="mb-4 text-blue-600">Processing...</div>}
        {status === 'unauth' && <div className="mb-4 text-yellow-600">Not authenticated. Redirecting to login...</div>}
        {status === 'success' && (
          <div className="mb-4 text-green-600">
            {message}
          </div>
        )}
        {status === 'error' && <div className="mb-4 text-red-600">{message}</div>}
        {checkedIn ? (
          <Button onClick={handleCheckout} disabled={status === 'loading'}>Check Out</Button>
        ) : (
          <Button disabled>Checked Out</Button>
        )}
      </div>
    </div>
  );
}
