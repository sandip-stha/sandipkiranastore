import {
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col overflow-x-hidden">
        
        <div className="min-h-screen bg-gray-100 py-12 px-5">
        <div className="max-w-7xl mx-auto">

            <h1 className="text-4xl font-bold text-center text-green-700 mb-3">
            Contact Us
            </h1>

            <p className="text-center text-gray-600 mb-10">
            We'd love to hear from you. Feel free to visit or contact us anytime.
            </p>

            <div className="grid lg:grid-cols-2 gap-8">

            {/* Google Map */}

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3534.3035564900188!2d85.39529837525147!3d27.646078476217706!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1122856086c1%3A0xd957085275966952!2sSandip%20Kirana%20Store!5e0!3m2!1sen!2snp!4v1781842700456!5m2!1sen!2snp"
                width="100%"
                height="550"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Sandip Kirana Store"
                />
            </div>

            {/* Contact Details */}

            <div className="space-y-6">

                <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-5 hover:shadow-2xl transition">

                <div className="bg-green-100 p-4 rounded-full">
                    <MapPin className="text-green-600 w-7 h-7" />
                </div>

                <div>
                    <h3 className="font-bold text-xl">
                    Address
                    </h3>

                    <p className="text-gray-600 mt-1">
                    Sandip Kirana Store<br />
                    Suryabinayek, 1, Bhaktapur
                    </p>

                </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-5 hover:shadow-2xl transition">

                <div className="bg-blue-100 p-4 rounded-full">
                    <Phone className="text-blue-600 w-7 h-7" />
                </div>

                <div>

                    <h3 className="font-bold text-xl">
                    Phone
                    </h3>

                    <p className="text-gray-600 mt-1">
                    +977-9860428834
                    </p>

                </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-5 hover:shadow-2xl transition">

                <div className="bg-red-100 p-4 rounded-full">
                    <Mail className="text-red-600 w-7 h-7" />
                </div>

                <div>

                    <h3 className="font-bold text-xl">
                    Email
                    </h3>

                    <p className="text-gray-600 mt-1">
                    shresthasandip534@gmail.com
                    </p>

                </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-5 hover:shadow-2xl transition">

                <div className="bg-yellow-100 p-4 rounded-full">
                    <Clock className="text-yellow-600 w-7 h-7" />
                </div>

                <div>

                    <h3 className="font-bold text-xl">
                    Opening Hours
                    </h3>

                    <p className="text-gray-600 mt-1">
                    Sunday - Saturday
                    <br />
                    7:00 AM - 9:00 PM
                    </p>

                </div>

                </div>

            </div>

            </div>
        </div>
        </div>
    </div>
  );
}