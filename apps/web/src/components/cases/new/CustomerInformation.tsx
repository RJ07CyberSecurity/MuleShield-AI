"use client";

import { useNewCaseStore } from "../../../store/useNewCaseStore";
import { Upload } from "lucide-react";

export default function CustomerInformation() {
  const {
    customerName, fatherName, dob, gender, nationality, occupation,
    customerId, panNumber, aadhaarNumber, passportNumber,
    phoneNumber, altPhone, email, address, city, state, country, pinCode,
    updateField
  } = useNewCaseStore();

  return (
    <div className="bg-surface/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant/30 pb-3">2. Customer / Suspect Information</h3>
      
      <div className="flex flex-col md:flex-row gap-8 mb-6">
        <div className="w-full md:w-32 flex-shrink-0">
          <div className="w-32 h-32 rounded-xl bg-surface-container-lowest border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center text-on-surface-variant cursor-pointer hover:border-primary/50 hover:text-primary transition-colors overflow-hidden group">
            <Upload size={24} className="mb-2 group-hover:-translate-y-1 transition-transform" />
            <span className="text-xs text-center px-2">Upload Photo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Customer Name *</label>
            <input type="text" value={customerName} onChange={e => updateField("customerName", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Father's Name</label>
            <input type="text" value={fatherName} onChange={e => updateField("fatherName", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Date of Birth</label>
            <input type="date" value={dob} onChange={e => updateField("dob", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Gender</label>
            <select value={gender} onChange={e => updateField("gender", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 appearance-none">
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Nationality</label>
            <input type="text" value={nationality} onChange={e => updateField("nationality", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Occupation</label>
            <input type="text" value={occupation} onChange={e => updateField("occupation", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Customer ID</label>
          <input type="text" value={customerId} onChange={e => updateField("customerId", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">PAN Number</label>
          <input type="text" value={panNumber} onChange={e => updateField("panNumber", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 uppercase" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Aadhaar Number</label>
          <input type="text" value={aadhaarNumber} onChange={e => updateField("aadhaarNumber", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Passport Number</label>
          <input type="text" value={passportNumber} onChange={e => updateField("passportNumber", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 uppercase" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Phone Number *</label>
          <input type="tel" value={phoneNumber} onChange={e => updateField("phoneNumber", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Alternative Phone</label>
          <input type="tel" value={altPhone} onChange={e => updateField("altPhone", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Email Address</label>
          <input type="email" value={email} onChange={e => updateField("email", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="md:col-span-2 lg:col-span-4">
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Residential Address</label>
          <input type="text" value={address} onChange={e => updateField("address", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">City</label>
          <input type="text" value={city} onChange={e => updateField("city", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">State</label>
          <input type="text" value={state} onChange={e => updateField("state", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">Country</label>
          <input type="text" value={country} onChange={e => updateField("country", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-2">PIN Code</label>
          <input type="text" value={pinCode} onChange={e => updateField("pinCode", e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>
      </div>
    </div>
  );
}
