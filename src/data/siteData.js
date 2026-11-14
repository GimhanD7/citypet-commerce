import {
  Bath,
  Bone,
  Building2,
  HeartPulse,
  House,
  Microscope,
  PackageOpen,
  PawPrint,
  Pill,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  TestTube2,
  Waves,
} from 'lucide-react'

import drSugath from '../assets/doctor-sugath.jpg'
import drPavithra from '../assets/doctor-pavithra.jpg'
import drSugandhika from '../assets/doctor-sugandhika.jpg'

export const doctors = [
  {
    name: 'Dr. Sugath Pemachandra',
    role: 'Managing Director, Chief Veterinary Surgeon',
    qualifications: 'BVSc (SL), MSLCVS',
    reg: '1504',
    image: drSugath,
  },
  {
    name: 'Dr. Pavithra Eshwara',
    role: 'Veterinary Surgeon',
    qualifications: 'BVSc (SL)',
    reg: '1521',
    image: drPavithra,
  },
  {
    name: 'Dr. Sugandhika Gothami',
    role: 'Veterinary Surgeon',
    qualifications: 'BVSc (SL)',
    reg: '1654',
    image: drSugandhika,
  },
]

export const services = [
  { icon: Stethoscope, title: 'Medicine & Treatments', text: 'Companion animal medicine, diagnosis, treatments and preventive care.' },
  { icon: HeartPulse, title: 'Animal Surgeries', text: 'Companion animal surgery with careful clinical management.' },
  { icon: Microscope, title: 'Laboratory', text: 'On-site laboratory facilities that support disease diagnosis.' },
  { icon: ShieldCheck, title: 'Counseling', text: 'Guidance on vaccination, deworming, zoonotic disease and routine pet health.' },
  { icon: Bone, title: 'Foods & Accessories', text: 'Pet food and useful accessories available through the hospital.' },
  { icon: House, title: 'Mobile Service', text: 'Home-visit treatment across selected service areas. Call to check availability.' },
  { icon: Building2, title: 'Boarding & Warding', text: 'Boarding and warding facilities for pets that need supervised care.' },
  { icon: Bath, title: 'Grooming & Bathing', text: 'Convenient grooming and bathing services for healthy, comfortable pets.' },
  { icon: Pill, title: 'Pharmacy', text: 'On-site pharmacy facilities for veterinary medicines and prescribed care.' },
  { icon: TestTube2, title: 'Post Mortem', text: 'Post-mortem examinations performed as part of veterinary diagnostic services.' },
  { icon: Waves, title: 'Public Awareness', text: 'Pet safety, public awareness and occupational health education programs.' },
  { icon: PawPrint, title: 'Behaviour Advising', text: 'Advice on animal behaviour, safe restraint and emergency health care.' },
  { icon: ScanLine, title: '3D Ultrasound Scan', text: 'Ultrasound scanning facilities supporting modern veterinary diagnosis.' },
  { icon: PackageOpen, title: 'X-Ray', text: 'X-ray services to support accurate diagnosis and better treatment decisions.' },
]

export const areas = [
  'Athurugiriya', 'Kaduwela', 'Godagama', 'Malabe', 'Homagama', 'Kottawa',
  'Pannipitiya', 'Maharagama', 'Nugegoda', 'Battaramulla', 'Thalawatugoda',
  'Rajagiriya', 'Kotte', 'Piliyandala', 'Moratuwa', 'Dehiwala', 'Colombo',
  'Beruwala', 'Kalutara', 'Mount Lavinia',
]
