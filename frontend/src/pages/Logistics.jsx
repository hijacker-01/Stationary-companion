import React, { useState, useEffect } from "react";
import axios from "axios";
import { Truck, Users, Map, Clock, CheckCircle } from "lucide-react";
import Header from "../components/Header";
import BusinessFooter from "../components/BusinessFooter";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function Logistics() {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    // Dummy Data Fallback / simulated fetch
    const fetchLogistics = async () => {
      try {
        const [drv, veh, del] = await Promise.all([
          axios.get("/api/logistics/drivers", { headers: headers() }),
          axios.get("/api/logistics/vehicles", { headers: headers() }),
          axios.get("/api/logistics/deliveries", { headers: headers() })
        ]);
        setDrivers(drv.data);
        setVehicles(veh.data);
        setDeliveries(del.data);
      } catch (err) {
        setDrivers([
          { id: 'D01', name: 'Raj Kumar', phone: '9876543210', status: 'Available' },
          { id: 'D02', name: 'Amit Singh', phone: '9123456780', status: 'On Route' }
        ]);
        setVehicles([
          { id: 'V01', regNo: 'MH-12-AB-1234', capacity: '1.5 Ton', status: 'Available' },
          { id: 'V02', regNo: 'MH-12-XY-9876', capacity: '2.0 Ton', status: 'Maintenance' }
        ]);
        setDeliveries([
          { id: 'INV-1001', customer: 'City Hospital', area: 'Downtown', value: 45000, status: 'Pending', assignedTo: '' },
          { id: 'INV-1002', customer: 'Apollo Pharmacy', area: 'West End', value: 12500, status: 'Assigned', assignedTo: 'D02 (V01)' }
        ]);
      }
    };
    fetchLogistics();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-xs text-gray-800">
      <Header title="Logistics & Route Planning" />
      
      <main className="flex-1 p-2 flex flex-col gap-2 overflow-hidden">
        {/* Top: Masters Overview */}
        <div className="flex gap-2 h-1/3">
          {/* Drivers */}
          <section className="w-1/2 bg-white border border-gray-300 shadow-sm flex flex-col">
            <div className="bg-gray-200 border-b border-gray-300 p-2 font-bold flex items-center">
              <Users className="w-4 h-4 mr-2" /> Drivers
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 sticky top-0 border-b border-gray-300">
                  <tr>
                    <th className="p-1 border-r border-gray-300">ID</th>
                    <th className="p-1 border-r border-gray-300">Name</th>
                    <th className="p-1 border-r border-gray-300">Phone</th>
                    <th className="p-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map(d => (
                    <tr key={d.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-1 border-r border-gray-300">{d.id}</td>
                      <td className="p-1 border-r border-gray-300">{d.name}</td>
                      <td className="p-1 border-r border-gray-300">{d.phone}</td>
                      <td className={`p-1 ${d.status === 'Available' ? 'text-green-600' : 'text-orange-600'} font-bold`}>{d.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Vehicles */}
          <section className="w-1/2 bg-white border border-gray-300 shadow-sm flex flex-col">
            <div className="bg-gray-200 border-b border-gray-300 p-2 font-bold flex items-center">
              <Truck className="w-4 h-4 mr-2" /> Vehicles
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 sticky top-0 border-b border-gray-300">
                  <tr>
                    <th className="p-1 border-r border-gray-300">ID</th>
                    <th className="p-1 border-r border-gray-300">Reg No</th>
                    <th className="p-1 border-r border-gray-300">Capacity</th>
                    <th className="p-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-1 border-r border-gray-300">{v.id}</td>
                      <td className="p-1 border-r border-gray-300">{v.regNo}</td>
                      <td className="p-1 border-r border-gray-300">{v.capacity}</td>
                      <td className={`p-1 ${v.status === 'Available' ? 'text-green-600' : 'text-red-600'} font-bold`}>{v.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Bottom: Deliveries */}
        <section className="flex-1 bg-white border border-gray-300 shadow-sm flex flex-col">
          <div className="bg-gray-200 border-b border-gray-300 p-2 font-bold flex justify-between items-center">
            <div className="flex items-center"><Map className="w-4 h-4 mr-2" /> Pending Deliveries & Routing</div>
            <button className="bg-blue-600 text-white px-3 py-1 rounded shadow text-xs hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-800" tabIndex={0}>
              Auto-Route Selected
            </button>
          </div>
          <div className="flex-1 overflow-auto p-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 sticky top-0 border-b border-gray-300">
                <tr>
                  <th className="p-1 border-r border-gray-300 w-8 text-center"><input type="checkbox" tabIndex={-1} /></th>
                  <th className="p-1 border-r border-gray-300">Invoice No</th>
                  <th className="p-1 border-r border-gray-300">Customer</th>
                  <th className="p-1 border-r border-gray-300">Area/Route</th>
                  <th className="p-1 border-r border-gray-300 text-right">Value (₹)</th>
                  <th className="p-1 border-r border-gray-300">Status</th>
                  <th className="p-1 border-r border-gray-300">Assigned To</th>
                  <th className="p-1 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(del => (
                  <tr key={del.id} className="border-b border-gray-200 hover:bg-blue-50">
                    <td className="p-1 border-r border-gray-300 text-center"><input type="checkbox" tabIndex={0} /></td>
                    <td className="p-1 border-r border-gray-300 text-blue-700 font-semibold">{del.id}</td>
                    <td className="p-1 border-r border-gray-300">{del.customer}</td>
                    <td className="p-1 border-r border-gray-300">{del.area}</td>
                    <td className="p-1 border-r border-gray-300 text-right">{del.value.toLocaleString()}</td>
                    <td className="p-1 border-r border-gray-300">
                      {del.status === 'Pending' ? <span className="text-orange-600 flex items-center"><Clock className="w-3 h-3 mr-1"/> Pending</span> : <span className="text-blue-600 flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Assigned</span>}
                    </td>
                    <td className="p-1 border-r border-gray-300">{del.assignedTo || '-'}</td>
                    <td className="p-1 text-center">
                      <select className="border border-gray-300 text-xs p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-600" tabIndex={0}>
                        <option value="">Assign...</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <BusinessFooter />
    </div>
  );
}
