import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "react-qr-code";
import { X, Upload, Download, FileText } from "lucide-react";

interface IDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName: string;
  defaultEmail: string;
  defaultRole: string;
  defaultPhoto?: string;
}

export default function IDCardModal({ isOpen, onClose, defaultName, defaultEmail, defaultRole, defaultPhoto }: IDCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: defaultName || "RUDRAKUMAR JOSHI",
    email: defaultEmail || "rudrajoshi2586@gmail.com",
    role: defaultRole || "INVESTIGATOR",
    employeeId: "MS-9942-F",
    department: "Financial Intelligence",
    status: "ACTIVE",
    issuedDate: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2))
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-"),
  });

  // Image states
  const [photoPreview, setPhotoPreview] = useState<string | null>(defaultPhoto || null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  useEffect(() => {
    if (defaultPhoto) {
      setPhotoPreview(defaultPhoto);
    }
  }, [defaultPhoto]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportPNG = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, logging: false });
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `MuleShield_ID_${formData.employeeId}.png`;
    link.click();
  };

  const handleExportPDF = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, logging: false });
    const imgData = canvas.toDataURL("image/png");
    // Standard credit card / ID card size in mm is approx 86 x 54 mm
    // Our ratio is 693x390, which is 1.77
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [86, 54]
    });
    pdf.addImage(imgData, "PNG", 0, 0, 86, 54);
    pdf.save(`MuleShield_ID_${formData.employeeId}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-2xl flex flex-col xl:flex-row w-full max-w-7xl my-auto">
        
        {/* Left Side: Form Controls */}
        <div className="w-full xl:w-1/3 border-b xl:border-b-0 xl:border-r border-outline-variant/30 p-6 bg-surface-container-lowest rounded-l-2xl overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-on-surface">Generate ID Card</h2>
            <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs font-bold text-on-surface-variant">FULL NAME</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-on-surface-variant">ROLE</label>
                <input type="text" name="role" value={formData.role} onChange={handleInputChange} className="w-full mt-1 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant">EMPLOYEE ID</label>
                <input type="text" name="employeeId" value={formData.employeeId} onChange={handleInputChange} className="w-full mt-1 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-on-surface-variant">DEPARTMENT</label>
                <input type="text" name="department" value={formData.department} onChange={handleInputChange} className="w-full mt-1 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant">STATUS</label>
                <input type="text" name="status" value={formData.status} onChange={handleInputChange} className="w-full mt-1 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs font-bold text-on-surface-variant">EMAIL</label>
              <input type="text" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-on-surface-variant">ISSUED DATE</label>
                <input type="text" name="issuedDate" value={formData.issuedDate} onChange={handleInputChange} className="w-full mt-1 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant">EXPIRY DATE</label>
                <input type="text" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="w-full mt-1 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/30 text-on-surface text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>

            <hr className="border-outline-variant/20 my-4" />
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface-variant block">UPLOAD IMAGES</label>
              
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-surface-container hover:bg-surface-container-high px-3 py-2 rounded-lg text-sm text-on-surface transition-colors">
                  <Upload className="w-4 h-4 text-primary" />
                  <span>Profile Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setPhotoPreview)} />
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-surface-container hover:bg-surface-container-high px-3 py-2 rounded-lg text-sm text-on-surface transition-colors">
                  <Upload className="w-4 h-4 text-primary" />
                  <span>Custom Logo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setLogoPreview)} />
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-surface-container hover:bg-surface-container-high px-3 py-2 rounded-lg text-sm text-on-surface transition-colors">
                  <Upload className="w-4 h-4 text-primary" />
                  <span>Signature Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setSignaturePreview)} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Live Preview & Export */}
        <div className="w-full xl:w-2/3 p-8 flex flex-col items-center justify-center bg-surface-container-lowest rounded-r-2xl overflow-x-auto">
          <div className="mb-6 w-full flex justify-between items-center max-w-[693px]">
            <h3 className="font-bold text-on-surface text-lg">Live Preview</h3>
            <div className="flex gap-3">
              <button onClick={handleExportPNG} className="flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-sm font-bold transition-all">
                <Download className="w-4 h-4" /> PNG
              </button>
              <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all">
                <FileText className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>

          {/* ID CARD CONTAINER */}
          {/* Card size: exactly 693x390px */}
          <div className="relative shadow-2xl rounded-[20px] overflow-hidden bg-[#F5F5F5] shrink-0 group transition-transform duration-300 hover:scale-[1.02]" style={{ width: 693, height: 390 }} ref={cardRef}>
            
            {/* World Map Watermark Background */}
            <div 
              className="absolute inset-0 z-0 opacity-5"
              style={{
                backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')`,
                backgroundSize: '80%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />

            {/* HEADER BAND */}
            <div className="absolute top-0 left-0 w-full h-[90px] bg-[#6B1E4C] flex items-center px-6 z-10 shadow-md">
              {/* Logo Area */}
              <div className="w-[64px] h-[64px] rounded-full bg-white border-[3px] border-[#D4AF37] flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[#6B1E4C] text-[10px] font-black text-center leading-tight">LOGO</div>
                )}
              </div>

              {/* Titles */}
              <div className="ml-5 flex-1">
                <h1 className="text-white text-3xl font-black tracking-widest leading-none drop-shadow-md" style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}>MULESHIELD AI</h1>
                <h2 className="text-white/90 text-sm font-semibold tracking-[0.25em] mt-1.5 drop-shadow-sm">INVESTIGATOR CARD</h2>
              </div>
              
              {/* Employee ID Top Right */}
              <div className="text-right">
                <div className="text-white/70 text-[10px] font-bold tracking-widest mb-0.5">ID NO</div>
                <div className="text-white text-lg font-mono font-bold">{formData.employeeId}</div>
              </div>
            </div>

            {/* BODY CONTENT */}
            <div className="absolute top-[90px] bottom-[70px] left-0 w-full px-8 py-6 flex z-10">
              
              {/* Left & Middle Info Area */}
              <div className="flex-1 flex flex-col justify-between h-full">
                {/* Role text */}
                <div className="text-[#D4AF37] text-[28px] font-black tracking-widest uppercase drop-shadow-sm" style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}>
                  {formData.role}
                </div>
                
                <div className="flex mt-2 gap-12">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-black/60 text-[10px] font-black tracking-widest mb-0.5">NAME</div>
                      <div className="text-[#1A1A1A] text-[15px] font-bold uppercase tracking-wide">{formData.name}</div>
                    </div>
                    <div>
                      <div className="text-black/60 text-[10px] font-black tracking-widest mb-0.5">DEPARTMENT</div>
                      <div className="text-[#1A1A1A] text-[15px] font-bold uppercase tracking-wide">{formData.department}</div>
                    </div>
                    <div>
                      <div className="text-black/60 text-[10px] font-black tracking-widest mb-0.5">EMAIL</div>
                      <div className="text-[#1A1A1A] text-[15px] font-bold tracking-wide">{formData.email}</div>
                    </div>
                  </div>

                  {/* Middle Column */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-black/60 text-[10px] font-black tracking-widest mb-0.5">STATUS</div>
                      <div className="text-[#1A1A1A] text-[15px] font-bold uppercase tracking-wide">{formData.status}</div>
                    </div>
                    <div>
                      <div className="text-black/60 text-[10px] font-black tracking-widest mb-0.5">ISSUED DATE</div>
                      <div className="text-[#1A1A1A] text-[15px] font-bold tracking-wide">{formData.issuedDate}</div>
                    </div>
                    <div>
                      <div className="text-black/60 text-[10px] font-black tracking-widest mb-0.5">EXPIRY DATE</div>
                      <div className="text-[#1A1A1A] text-[15px] font-bold tracking-wide">{formData.expiryDate}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Box Right */}
              <div className="w-[145px] h-[190px] bg-white rounded-lg overflow-hidden border-4 border-[#E5E5E5] shadow-lg mt-1 ml-4 shrink-0 flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-300" />
                )}
              </div>
            </div>

            {/* FOOTER BAND */}
            <div className="absolute bottom-0 left-0 w-full h-[70px] bg-[#6B1E4C] flex items-center justify-between px-6 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              
              {/* Left footer: badge/icon */}
              <div className="flex items-center gap-5">
                <div className="w-[44px] h-[44px] rounded-full bg-white/10 flex items-center justify-center">
                  <div className="w-[32px] h-[32px] rounded-full border border-[#D4AF37]/60" />
                </div>
                
                {/* Signature box */}
                <div className="w-[140px] h-[40px] bg-white rounded shadow-inner overflow-hidden flex items-center justify-center px-2">
                  {signaturePreview ? (
                    <img src={signaturePreview} alt="Signature" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-400 text-[10px] font-mono italic">Authorized Signature</span>
                  )}
                </div>
              </div>

              {/* Right footer: Name & QR Code */}
              <div className="flex items-center gap-4">
                <div className="text-white text-sm font-bold tracking-wider uppercase text-right opacity-90 drop-shadow-sm">
                  {formData.name}
                </div>
                <div className="w-[52px] h-[52px] bg-white rounded shadow flex items-center justify-center p-1">
                  <QRCode value={`verify:muleshield.ai/${formData.employeeId}`} size={44} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                </div>
              </div>
              
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  );
}
