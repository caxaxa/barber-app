import React, { useState } from 'react';

const AppointmentModal = ({ dateTime, onClose, onSubmit }) => {
  // If dateTime includes a space, split it; otherwise, assume it's just the date.
  const initialDate = dateTime && dateTime.includes(' ') ? dateTime.split(' ')[0] : dateTime;
  const initialTime = dateTime && dateTime.includes(' ') ? dateTime.split(' ')[1] : '';

  const [date, setDate] = useState(initialDate || '');
  const [startTime, setStartTime] = useState(initialTime || '');
  const [barberId, setBarberId] = useState(1); // Default barber ID
  const [duration, setDuration] = useState(40); // Default duration in minutes
  const [clientName, setClientName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !startTime) {
      alert('Please provide both date and start time.');
      return;
    }
    const appointmentData = {
      barber_id: barberId,
      date,
      start_time: startTime,
      duration,
      client_name: clientName || 'Manual Booking'
    };
    onSubmit(appointmentData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', minWidth: '300px' }}>
        <h3>Schedule Appointment</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Date: </label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label>Start Time: </label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </div>
          <div>
            <label>Barber ID: </label>
            <input type="number" value={barberId} onChange={(e) => setBarberId(Number(e.target.value))} required />
          </div>
          <div>
            <label>Duration (min): </label>
            <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} required />
          </div>
          <div>
            <label>Client Name: </label>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <button type="submit">Book Appointment</button>
            <button type="button" onClick={onClose} style={{ marginLeft: '10px' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;
