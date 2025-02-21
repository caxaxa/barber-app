import React, { useState } from 'react';

const AppointmentModal = ({ dateTime, onClose, apiEndpoint, refreshAppointments }) => {
  // Pre-fill the date field if a date was provided from the calendar click
  const initialDate = dateTime || '';
  const initialTime = ''; // Month view provides only a date

  const [formData, setFormData] = useState({
    barber_id: '',
    date: initialDate,
    start_time: initialTime,
    duration: 40,
    client_name: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.start_time || !formData.barber_id) {
      alert('Please fill in all required fields.');
      return;
    }
    try {
      const res = await fetch(`${apiEndpoint}/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Appointment booked successfully!');
        onClose();
        refreshAppointments();
      } else {
        alert('Error booking appointment: ' + data.message);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Error booking appointment.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-2xl font-bold mb-4">Book Appointment</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Start Time:</label>
            <input
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Barber ID:</label>
            <input
              type="number"
              name="barber_id"
              value={formData.barber_id}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Duration (minutes):</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Client Name:</label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
              Book
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;
