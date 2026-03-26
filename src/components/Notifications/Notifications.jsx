import { useEffect, useState } from "react";
import { getPasswordRequests, approveRequest } from "../services/api";

function Notifications() {

  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    const res = await getPasswordRequests();
    setRequests(res.data);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    await approveRequest(id);
    fetchRequests();
  };

  return (
    <div className="notification-box">

      <h3>Demandes reset password</h3>

      {requests.map((r) => (
        <div key={r.id} className="notif-item">

          <p>{r.email}</p>

          <button onClick={() => handleApprove(r.id)}>
            Approuver
          </button>

        </div>
      ))}

    </div>
  );
}

export default Notifications;