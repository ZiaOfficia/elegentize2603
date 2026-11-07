import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Calendar, User, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { submitToGoogleSheets } from "../../utils/googleSheets";
import { sendEmailNotification } from "../../utils/emailNotification";

interface ServiceEnquiryFormProps {
  serviceName: string;
  variant?: "horizontal" | "full";
}

export const ServiceEnquiryForm = ({
  serviceName,
  variant = "horizontal",
}: ServiceEnquiryFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventDate: "",
    message: "",
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Trigger background tasks (non-blocking)
      submitToGoogleSheets({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        eventDate: formData.eventDate,
        message: formData.message,
        serviceName: serviceName || "Inquiry",
        source: `Service Page Form (${variant})`,
      });

      sendEmailNotification({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        eventDate: formData.eventDate,
        message: formData.message,
        serviceName: serviceName || "Inquiry",
      });

      // Redirect instantly
      navigate("/thank-you");

      setFormData({
        name: "",
        email: "",
        phone: "",
        eventDate: "",
        message: "",
      });
    } catch (error) {
      console.error("Submission error:", error);
      // Navigate anyway for instant feel
      navigate("/thank-you");
    }
  };

  // Horizontal Variant
  if (variant === "horizontal") {
    return (
      <div className="bg-white shadow-xl p-6 md:p-8 border-t-4 border-primary flex flex-col gap-6">
        <div>
          <h3 className="font-display text-xl text-gray-900 mb-2">
            Begin your inquiry
          </h3>
          <p className="text-sm text-gray-500">
            Tell us about your event vision.
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-stone-50 border-none pl-10 pr-4 py-3 focus:ring-1 focus:ring-primary text-gray-600 text-sm focus:outline-none"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-stone-50 border-none pl-10 pr-4 py-3 focus:ring-1 focus:ring-primary text-gray-600 text-sm focus:outline-none"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="tel"
                placeholder="Phone"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full bg-stone-50 border-none pl-10 pr-4 py-3 focus:ring-1 focus:ring-primary text-gray-600 text-sm focus:outline-none"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Event Date *"
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.type = "text")}
                required
                value={formData.eventDate}
                onChange={(e) =>
                  setFormData({ ...formData, eventDate: e.target.value })
                }
                className="w-full bg-stone-50 border-none pl-10 pr-4 py-3 focus:ring-1 focus:ring-primary text-gray-600 text-sm focus:outline-none"
              />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Your Message..."
                required
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full bg-stone-50 border-none pl-4 pr-10 py-3 focus:ring-1 focus:ring-primary text-gray-600 text-sm focus:outline-none"
              />
              <Send className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            </div>

            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-wider text-xs py-3 px-6 transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Send className="w-3 h-3" /> Submit Inquiry
            </button>
          </div>
        </motion.form>
      </div>
    );
  }

  // Full variant
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onSubmit={handleSubmit}
      className="bg-white p-10 border border-t-4 border-gray-100 border-t-primary shadow-lg space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-2 text-gray-500">
            First Name
          </label>
          <input
            type="text"
            required
            value={formData.name.split(" ")[0]}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-stone-50 border border-gray-200 focus:outline-none focus:border-primary p-3 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-2 text-gray-500">
            Email Address
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full bg-stone-50 border border-gray-200 focus:outline-none focus:border-primary p-3 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-2 text-gray-500">
            Phone Number
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full bg-stone-50 border border-gray-200 focus:outline-none focus:border-primary p-3 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-2 text-gray-500">
            Event Date
          </label>
          <input
            type="date"
            value={formData.eventDate}
            onChange={(e) =>
              setFormData({ ...formData, eventDate: e.target.value })
            }
            className="w-full bg-stone-50 border border-gray-200 focus:outline-none focus:border-primary p-3 text-sm text-gray-900"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-2 text-gray-500">
            Tell us about your vision
          </label>
          <textarea
            rows={4}
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            placeholder={`Share your ideas for ${serviceName}...`}
            className="w-full bg-stone-50 border border-gray-200 focus:outline-none focus:border-primary p-3 text-sm text-gray-900 resize-none"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-[0.2em] text-xs py-4 transition-colors flex items-center justify-center gap-2"
      >
        Request Consultation
      </button>
    </motion.form>
  );
};