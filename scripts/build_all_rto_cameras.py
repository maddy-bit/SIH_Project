"""
Generates comprehensive camera nodes and RTO mapping for all RTO codes from the All-India Directory PDF.
"""
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

# All RTO codes from PDF
RTO_DATA = [
    # Page 1
    # Andaman & Nicobar Islands - AN
    {"code": "AN-01", "state": "Andaman & Nicobar Islands", "city": "Port Blair", "lat": 11.6234, "lon": 92.7265},
    # Andhra Pradesh - AP
    {"code": "AP-02", "state": "Andhra Pradesh", "city": "Anantapur", "lat": 14.6819, "lon": 77.6006},
    {"code": "AP-07", "state": "Andhra Pradesh", "city": "Guntur", "lat": 16.3067, "lon": 80.4365},
    {"code": "AP-16", "state": "Andhra Pradesh", "city": "Vijayawada", "lat": 16.5062, "lon": 80.6480},
    {"code": "AP-31", "state": "Andhra Pradesh", "city": "Visakhapatnam", "lat": 17.6868, "lon": 83.2185},
    {"code": "AP-39", "state": "Andhra Pradesh", "city": "Tirupati", "lat": 13.6288, "lon": 79.4192},
    # Arunachal Pradesh - AR
    {"code": "AR-01", "state": "Arunachal Pradesh", "city": "Itanagar", "lat": 27.0844, "lon": 93.6053},
    {"code": "AR-03", "state": "Arunachal Pradesh", "city": "Tawang", "lat": 27.5861, "lon": 91.8594},
    {"code": "AR-09", "state": "Arunachal Pradesh", "city": "Pasighat", "lat": 28.0664, "lon": 95.3267},
    # Assam - AS
    {"code": "AS-01", "state": "Assam", "city": "Guwahati", "lat": 26.1445, "lon": 91.7362},
    {"code": "AS-02", "state": "Assam", "city": "Nagaon", "lat": 26.3468, "lon": 92.6840},
    {"code": "AS-03", "state": "Assam", "city": "Jorhat", "lat": 26.7509, "lon": 94.2037},
    {"code": "AS-06", "state": "Assam", "city": "Dibrugarh", "lat": 27.4728, "lon": 94.9120},
    {"code": "AS-11", "state": "Assam", "city": "Silchar", "lat": 24.8333, "lon": 92.7789},
    # Bihar - BR
    {"code": "BR-01", "state": "Bihar", "city": "Patna", "lat": 25.5941, "lon": 85.1376},
    {"code": "BR-02", "state": "Bihar", "city": "Gaya", "lat": 24.7914, "lon": 85.0002},
    {"code": "BR-06", "state": "Bihar", "city": "Muzaffarpur", "lat": 26.1209, "lon": 85.3647},
    {"code": "BR-10", "state": "Bihar", "city": "Bhagalpur", "lat": 25.2425, "lon": 86.9842},
    {"code": "BR-31", "state": "Bihar", "city": "Bodh Gaya", "lat": 24.6961, "lon": 84.9870},
    # Chandigarh - CH
    {"code": "CH-01", "state": "Chandigarh", "city": "Chandigarh", "lat": 30.7333, "lon": 76.7794},
    # Chhattisgarh - CG
    {"code": "CG-04", "state": "Chhattisgarh", "city": "Raipur", "lat": 21.2514, "lon": 81.6296},
    {"code": "CG-07", "state": "Chhattisgarh", "city": "Durg", "lat": 21.1904, "lon": 81.2849},
    {"code": "CG-10", "state": "Chhattisgarh", "city": "Bilaspur", "lat": 22.0797, "lon": 82.1409},
    {"code": "CG-15", "state": "Chhattisgarh", "city": "Ambikapur", "lat": 23.1189, "lon": 83.1963},

    # Page 2
    # Dadra & Nagar Haveli and Daman & Diu - DD / DN
    {"code": "DD-01", "state": "Dadra & Nagar Haveli and Daman & Diu", "city": "Daman", "lat": 20.3974, "lon": 72.8328},
    {"code": "DN-09", "state": "Dadra & Nagar Haveli and Daman & Diu", "city": "Silvassa", "lat": 20.2763, "lon": 73.0083},
    {"code": "DD-03", "state": "Dadra & Nagar Haveli and Daman & Diu", "city": "Diu", "lat": 20.7144, "lon": 70.9874},
    # Delhi - DL
    {"code": "DL-01", "state": "Delhi", "city": "Mall Road / North Delhi", "lat": 28.6980, "lon": 77.2120},
    {"code": "DL-02", "state": "Delhi", "city": "New Delhi", "lat": 28.6139, "lon": 77.2090},
    {"code": "DL-03", "state": "Delhi", "city": "South Delhi", "lat": 28.5500, "lon": 77.2100},
    {"code": "DL-04", "state": "Delhi", "city": "West Delhi", "lat": 28.6500, "lon": 77.1200},
    {"code": "DL-05", "state": "Delhi", "city": "North-East Delhi", "lat": 28.7000, "lon": 77.2700},
    {"code": "DL-06", "state": "Delhi", "city": "Central Delhi", "lat": 28.6400, "lon": 77.2300},
    {"code": "DL-07", "state": "Delhi", "city": "East Delhi", "lat": 28.6280, "lon": 77.2950},
    {"code": "DL-08", "state": "Delhi", "city": "North-West Delhi", "lat": 28.7150, "lon": 77.1450},
    {"code": "DL-09", "state": "Delhi", "city": "South-West Delhi", "lat": 28.5800, "lon": 77.0600},
    {"code": "DL-10", "state": "Delhi", "city": "West Delhi Raja Garden", "lat": 28.6400, "lon": 77.1000},
    {"code": "DL-11", "state": "Delhi", "city": "Rohini", "lat": 28.7300, "lon": 77.1100},
    {"code": "DL-12", "state": "Delhi", "city": "Vasant Vihar", "lat": 28.5580, "lon": 77.1600},
    {"code": "DL-13", "state": "Delhi", "city": "Surajmal Vihar", "lat": 28.6550, "lon": 77.3100},
    # Goa - GA
    {"code": "GA-01", "state": "Goa", "city": "Panaji / North Goa", "lat": 15.4909, "lon": 73.8278},
    {"code": "GA-02", "state": "Goa", "city": "Margao / South Goa", "lat": 15.2832, "lon": 73.9862},
    {"code": "GA-03", "state": "Goa", "city": "Mapusa", "lat": 15.5937, "lon": 73.8142},
    {"code": "GA-04", "state": "Goa", "city": "Bicholim", "lat": 15.5900, "lon": 73.9500},
    # Gujarat - GJ
    {"code": "GJ-01", "state": "Gujarat", "city": "Ahmedabad", "lat": 23.0225, "lon": 72.5714},
    {"code": "GJ-03", "state": "Gujarat", "city": "Rajkot", "lat": 22.3039, "lon": 70.8022},
    {"code": "GJ-05", "state": "Gujarat", "city": "Surat", "lat": 21.1702, "lon": 72.8311},
    {"code": "GJ-06", "state": "Gujarat", "city": "Vadodara", "lat": 22.3072, "lon": 73.1812},
    {"code": "GJ-18", "state": "Gujarat", "city": "Gandhinagar", "lat": 23.2156, "lon": 72.6369},
    {"code": "GJ-27", "state": "Gujarat", "city": "Ahmedabad East", "lat": 23.0120, "lon": 72.6100},
    # Haryana - HR
    {"code": "HR-12", "state": "Haryana", "city": "Rohtak", "lat": 28.8955, "lon": 76.6066},
    {"code": "HR-13", "state": "Haryana", "city": "Hisar", "lat": 29.1492, "lon": 75.7217},
    {"code": "HR-26", "state": "Haryana", "city": "Gurugram", "lat": 28.4595, "lon": 77.0266},
    {"code": "HR-29", "state": "Haryana", "city": "Faridabad", "lat": 28.4089, "lon": 77.3178},
    {"code": "HR-51", "state": "Haryana", "city": "Panipat", "lat": 29.3909, "lon": 76.9635},
    {"code": "HR-55", "state": "Haryana", "city": "Jind", "lat": 29.3140, "lon": 76.3147},
    {"code": "HR-98", "state": "Haryana", "city": "Gurugram Commercial", "lat": 28.4900, "lon": 77.0800},
    # Himachal Pradesh - HP
    {"code": "HP-03", "state": "Himachal Pradesh", "city": "Shimla", "lat": 31.1048, "lon": 77.1734},
    {"code": "HP-12", "state": "Himachal Pradesh", "city": "Dharamshala", "lat": 32.2190, "lon": 76.3234},

    # Page 3
    # Himachal Pradesh - HP (cont.)
    {"code": "HP-34", "state": "Himachal Pradesh", "city": "Solan", "lat": 30.9084, "lon": 77.0999},
    {"code": "HP-38", "state": "Himachal Pradesh", "city": "Kangra", "lat": 32.0998, "lon": 76.2691},
    {"code": "HP-52", "state": "Himachal Pradesh", "city": "Mandi", "lat": 31.7087, "lon": 76.9320},
    # Jammu & Kashmir - JK
    {"code": "JK-02", "state": "Jammu & Kashmir", "city": "Jammu", "lat": 32.7266, "lon": 74.8570},
    {"code": "JK-04", "state": "Jammu & Kashmir", "city": "Srinagar", "lat": 34.0837, "lon": 74.7973},
    {"code": "JK-03", "state": "Jammu & Kashmir", "city": "Anantnag", "lat": 33.7311, "lon": 75.1487},
    # Jharkhand - JH
    {"code": "JH-01", "state": "Jharkhand", "city": "Ranchi", "lat": 23.3441, "lon": 85.3096},
    {"code": "JH-02", "state": "Jharkhand", "city": "Hazaribagh", "lat": 23.9930, "lon": 85.3644},
    {"code": "JH-05", "state": "Jharkhand", "city": "Jamshedpur", "lat": 22.8046, "lon": 86.2029},
    {"code": "JH-10", "state": "Jharkhand", "city": "Dhanbad", "lat": 23.7957, "lon": 86.4304},
    {"code": "JH-20", "state": "Jharkhand", "city": "Dumka", "lat": 24.2676, "lon": 87.2483},
    # Karnataka - KA
    {"code": "KA-01", "state": "Karnataka", "city": "Bengaluru Central", "lat": 12.9716, "lon": 77.5946},
    {"code": "KA-03", "state": "Karnataka", "city": "Bengaluru East", "lat": 12.9800, "lon": 77.6400},
    {"code": "KA-05", "state": "Karnataka", "city": "Bengaluru South", "lat": 12.9175, "lon": 77.6235},
    {"code": "KA-51", "state": "Karnataka", "city": "Bengaluru Electronic City", "lat": 12.8450, "lon": 77.6630},
    {"code": "KA-02", "state": "Karnataka", "city": "Bengaluru West", "lat": 12.9900, "lon": 77.5500},
    # Kerala - KL
    {"code": "KL-01", "state": "Kerala", "city": "Thiruvananthapuram", "lat": 8.5241, "lon": 76.9366},
    {"code": "KL-07", "state": "Kerala", "city": "Ernakulam / Kochi", "lat": 9.9816, "lon": 76.2999},
    {"code": "KL-11", "state": "Kerala", "city": "Kozhikode", "lat": 11.2588, "lon": 75.7804},
    {"code": "KL-14", "state": "Kerala", "city": "Wayanad", "lat": 11.6854, "lon": 76.1320},
    {"code": "KL-15", "state": "Kerala", "city": "State Transport Sector", "lat": 8.4900, "lon": 76.9500},
    # Ladakh - LA
    {"code": "LA-01", "state": "Ladakh", "city": "Leh", "lat": 34.1526, "lon": 77.5771},
    {"code": "LA-02", "state": "Ladakh", "city": "Kargil", "lat": 34.5539, "lon": 76.1349},
    # Lakshadweep - LD
    {"code": "LD-01", "state": "Lakshadweep", "city": "Kavaratti", "lat": 10.5669, "lon": 72.6420},
    # Madhya Pradesh - MP
    {"code": "MP-04", "state": "Madhya Pradesh", "city": "Bhopal", "lat": 23.2599, "lon": 77.4126},
    {"code": "MP-09", "state": "Madhya Pradesh", "city": "Indore", "lat": 22.7196, "lon": 75.8577},
    {"code": "MP-20", "state": "Madhya Pradesh", "city": "Jabalpur", "lat": 23.1815, "lon": 79.9864},
    {"code": "MP-07", "state": "Madhya Pradesh", "city": "Gwalior", "lat": 26.2183, "lon": 78.1828},
    {"code": "MP-13", "state": "Madhya Pradesh", "city": "Ujjain", "lat": 23.1765, "lon": 75.7885},

    # Page 4
    # Maharashtra - MH
    {"code": "MH-01", "state": "Maharashtra", "city": "Mumbai Central", "lat": 18.9690, "lon": 72.8205},
    {"code": "MH-02", "state": "Maharashtra", "city": "Mumbai West", "lat": 19.1190, "lon": 72.8470},
    {"code": "MH-03", "state": "Maharashtra", "city": "Mumbai East", "lat": 19.0728, "lon": 72.8826},
    {"code": "MH-04", "state": "Maharashtra", "city": "Thane", "lat": 19.2183, "lon": 72.9781},
    {"code": "MH-12", "state": "Maharashtra", "city": "Pune", "lat": 18.5204, "lon": 73.8567},
    {"code": "MH-14", "state": "Maharashtra", "city": "Pimpri-Chinchwad", "lat": 18.6298, "lon": 73.7997},
    {"code": "MH-15", "state": "Maharashtra", "city": "Nashik", "lat": 19.9975, "lon": 73.7898},
    {"code": "MH-31", "state": "Maharashtra", "city": "Nagpur", "lat": 21.1458, "lon": 79.0882},
    # Manipur - MN
    {"code": "MN-01", "state": "Manipur", "city": "Imphal", "lat": 24.8170, "lon": 93.9368},
    # Meghalaya - ML
    {"code": "ML-05", "state": "Meghalaya", "city": "Shillong", "lat": 25.5788, "lon": 91.8933},
    # Mizoram - MZ
    {"code": "MZ-01", "state": "Mizoram", "city": "Aizawl", "lat": 23.7271, "lon": 92.7176},
    # Nagaland - NL
    {"code": "NL-01", "state": "Nagaland", "city": "Kohima", "lat": 25.6751, "lon": 94.1086},
    {"code": "NL-07", "state": "Nagaland", "city": "Dimapur", "lat": 25.9068, "lon": 93.7270},
    # Odisha - OD
    {"code": "OD-02", "state": "Odisha", "city": "Bhubaneswar", "lat": 20.2961, "lon": 85.8245},
    {"code": "OD-05", "state": "Odisha", "city": "Cuttack", "lat": 20.4625, "lon": 85.8828},
    {"code": "OD-07", "state": "Odisha", "city": "Berhampur", "lat": 19.3149, "lon": 84.7941},
    {"code": "OD-14", "state": "Odisha", "city": "Rourkela", "lat": 22.2604, "lon": 84.8536},
    {"code": "OD-33", "state": "Odisha", "city": "Sundargarh", "lat": 22.1197, "lon": 84.0375},
    # Puducherry - PY
    {"code": "PY-01", "state": "Puducherry", "city": "Puducherry", "lat": 11.9416, "lon": 79.8083},
    {"code": "PY-02", "state": "Puducherry", "city": "Karaikal", "lat": 10.9254, "lon": 79.8380},
    {"code": "PY-03", "state": "Puducherry", "city": "Mahe", "lat": 11.7002, "lon": 75.5343},
    {"code": "PY-04", "state": "Puducherry", "city": "Yanam", "lat": 16.7330, "lon": 82.2174},
    # Punjab - PB
    {"code": "PB-02", "state": "Punjab", "city": "Amritsar", "lat": 31.6340, "lon": 74.8723},
    {"code": "PB-08", "state": "Punjab", "city": "Amritsar South", "lat": 31.6100, "lon": 74.8500},
    {"code": "PB-10", "state": "Punjab", "city": "Ludhiana", "lat": 30.9010, "lon": 75.8573},
    {"code": "PB-11", "state": "Punjab", "city": "Patiala", "lat": 30.3398, "lon": 76.3869},
    {"code": "PB-13", "state": "Punjab", "city": "Jalandhar", "lat": 31.3260, "lon": 75.5762},
    {"code": "PB-65", "state": "Punjab", "city": "Mohali", "lat": 30.7046, "lon": 76.7179},

    # Page 5
    # Rajasthan - RJ
    {"code": "RJ-14", "state": "Rajasthan", "city": "Jaipur", "lat": 26.9124, "lon": 75.7873},
    {"code": "RJ-19", "state": "Rajasthan", "city": "Jodhpur", "lat": 26.2389, "lon": 73.0243},
    {"code": "RJ-27", "state": "Rajasthan", "city": "Udaipur", "lat": 24.5854, "lon": 73.7125},
    {"code": "RJ-45", "state": "Rajasthan", "city": "Bikaner", "lat": 28.0229, "lon": 73.3119},
    {"code": "RJ-20", "state": "Rajasthan", "city": "Kota", "lat": 25.2138, "lon": 75.8648},
    # Sikkim - SK
    {"code": "SK-01", "state": "Sikkim", "city": "Gangtok", "lat": 27.3314, "lon": 88.6138},
    # Tamil Nadu - TN
    {"code": "TN-01", "state": "Tamil Nadu", "city": "Chennai Central", "lat": 13.0827, "lon": 80.2707},
    {"code": "TN-02", "state": "Tamil Nadu", "city": "Chennai North-West", "lat": 13.1000, "lon": 80.2200},
    {"code": "TN-09", "state": "Tamil Nadu", "city": "Chennai West", "lat": 13.0400, "lon": 80.2000},
    {"code": "TN-10", "state": "Tamil Nadu", "city": "Chennai South-West", "lat": 12.9800, "lon": 80.2100},
    {"code": "TN-22", "state": "Tamil Nadu", "city": "Meenambakkam / Chennai", "lat": 12.9880, "lon": 80.1650},
    {"code": "TN-37", "state": "Tamil Nadu", "city": "Coimbatore South", "lat": 10.9800, "lon": 76.9600},
    {"code": "TN-38", "state": "Tamil Nadu", "city": "Coimbatore North", "lat": 11.0200, "lon": 76.9600},
    # Telangana - TS / TG
    {"code": "TS-09", "state": "Telangana", "city": "Hyderabad Central", "lat": 17.3850, "lon": 78.4867},
    {"code": "TS-10", "state": "Telangana", "city": "Hyderabad North", "lat": 17.4400, "lon": 78.4900},
    {"code": "TS-11", "state": "Telangana", "city": "Hyderabad East", "lat": 17.3700, "lon": 78.5500},
    {"code": "TS-12", "state": "Telangana", "city": "Hyderabad South", "lat": 17.3200, "lon": 78.4700},
    {"code": "TS-13", "state": "Telangana", "city": "Hyderabad West", "lat": 17.4300, "lon": 78.3900},
    {"code": "TG-07", "state": "Telangana", "city": "Ranga Reddy", "lat": 17.4400, "lon": 78.3490},
    # Tripura - TR
    {"code": "TR-01", "state": "Tripura", "city": "Agartala", "lat": 23.8315, "lon": 91.2868},
    # Uttar Pradesh - UP
    {"code": "UP-11", "state": "Uttar Pradesh", "city": "Saharanpur", "lat": 29.9640, "lon": 77.5460},
    {"code": "UP-12", "state": "Uttar Pradesh", "city": "Muzaffarnagar", "lat": 29.4727, "lon": 77.7085},
    {"code": "UP-13", "state": "Uttar Pradesh", "city": "Bulandshahr", "lat": 28.4069, "lon": 77.8498},
    {"code": "UP-14", "state": "Uttar Pradesh", "city": "Ghaziabad", "lat": 28.6692, "lon": 77.4538},
    {"code": "UP-15", "state": "Uttar Pradesh", "city": "Meerut", "lat": 28.9845, "lon": 77.7064},
    {"code": "UP-16", "state": "Uttar Pradesh", "city": "Gautam Buddha Nagar / Noida", "lat": 28.5355, "lon": 77.3910},
    {"code": "UP-17", "state": "Uttar Pradesh", "city": "Baghpat", "lat": 28.9457, "lon": 77.2215},
    {"code": "UP-19", "state": "Uttar Pradesh", "city": "Shamli", "lat": 29.4485, "lon": 77.3117},
    {"code": "UP-20", "state": "Uttar Pradesh", "city": "Bijnor", "lat": 29.3732, "lon": 78.1352},
    {"code": "UP-21", "state": "Uttar Pradesh", "city": "Moradabad", "lat": 28.8386, "lon": 78.7733},
    {"code": "UP-22", "state": "Uttar Pradesh", "city": "Rampur", "lat": 28.8154, "lon": 79.0256},
    {"code": "UP-23", "state": "Uttar Pradesh", "city": "Amroha", "lat": 28.9044, "lon": 78.4682},
    {"code": "UP-24", "state": "Uttar Pradesh", "city": "Budaun", "lat": 28.0315, "lon": 79.1248},
    {"code": "UP-25", "state": "Uttar Pradesh", "city": "Bareilly", "lat": 28.3670, "lon": 79.4304},
    {"code": "UP-26", "state": "Uttar Pradesh", "city": "Pilibhit", "lat": 28.6315, "lon": 79.8037},
    {"code": "UP-27", "state": "Uttar Pradesh", "city": "Shahjahanpur", "lat": 27.8804, "lon": 79.9120},

    # Page 6
    {"code": "UP-30", "state": "Uttar Pradesh", "city": "Hardoi", "lat": 27.3953, "lon": 80.1314},
    {"code": "UP-31", "state": "Uttar Pradesh", "city": "Lakhimpur Kheri", "lat": 27.9463, "lon": 80.7787},
    {"code": "UP-32", "state": "Uttar Pradesh", "city": "Lucknow", "lat": 26.8467, "lon": 80.9462},
    {"code": "UP-32A", "state": "Uttar Pradesh", "city": "Trans Gomti, Lucknow", "lat": 26.8700, "lon": 80.9800},
    {"code": "UP-33", "state": "Uttar Pradesh", "city": "Rae Bareli", "lat": 26.2303, "lon": 81.2409},
    {"code": "UP-34", "state": "Uttar Pradesh", "city": "Sitapur", "lat": 27.5645, "lon": 80.6829},
    {"code": "UP-35", "state": "Uttar Pradesh", "city": "Unnao", "lat": 26.5393, "lon": 80.4878},
    {"code": "UP-36", "state": "Uttar Pradesh", "city": "Amethi", "lat": 26.1558, "lon": 81.8152},
    {"code": "UP-37", "state": "Uttar Pradesh", "city": "Hapur", "lat": 28.7306, "lon": 77.7759},
    {"code": "UP-38", "state": "Uttar Pradesh", "city": "Sambhal", "lat": 28.5833, "lon": 78.5667},
    {"code": "UP-40", "state": "Uttar Pradesh", "city": "Bahraich", "lat": 27.5750, "lon": 81.5947},
    {"code": "UP-41", "state": "Uttar Pradesh", "city": "Barabanki", "lat": 26.9276, "lon": 81.1843},
    {"code": "UP-42", "state": "Uttar Pradesh", "city": "Ayodhya", "lat": 26.7922, "lon": 82.1998},
    {"code": "UP-43", "state": "Uttar Pradesh", "city": "Gonda", "lat": 27.1337, "lon": 81.9619},
    {"code": "UP-44", "state": "Uttar Pradesh", "city": "Sultanpur", "lat": 26.2648, "lon": 82.0727},
    {"code": "UP-45", "state": "Uttar Pradesh", "city": "Ambedkar Nagar", "lat": 26.4448, "lon": 82.6848},
    {"code": "UP-46", "state": "Uttar Pradesh", "city": "Shravasti", "lat": 27.7011, "lon": 81.9169},
    {"code": "UP-47", "state": "Uttar Pradesh", "city": "Balrampur", "lat": 27.4292, "lon": 82.1856},
    {"code": "UP-50", "state": "Uttar Pradesh", "city": "Azamgarh", "lat": 26.0689, "lon": 83.1837},
    {"code": "UP-51", "state": "Uttar Pradesh", "city": "Basti", "lat": 26.7994, "lon": 82.7630},
    {"code": "UP-52", "state": "Uttar Pradesh", "city": "Deoria", "lat": 26.5024, "lon": 83.7791},
    {"code": "UP-53", "state": "Uttar Pradesh", "city": "Gorakhpur", "lat": 26.7606, "lon": 83.3732},
    {"code": "UP-54", "state": "Uttar Pradesh", "city": "Mau", "lat": 25.9417, "lon": 83.5611},
    {"code": "UP-55", "state": "Uttar Pradesh", "city": "Siddharthnagar", "lat": 27.2917, "lon": 82.8090},
    {"code": "UP-56", "state": "Uttar Pradesh", "city": "Maharajganj", "lat": 27.1458, "lon": 83.5606},
    {"code": "UP-57", "state": "Uttar Pradesh", "city": "Padrauna / Kushinagar", "lat": 26.9019, "lon": 83.9818},
    {"code": "UP-58", "state": "Uttar Pradesh", "city": "Sant Kabir Nagar", "lat": 26.7869, "lon": 83.0249},
    {"code": "UP-60", "state": "Uttar Pradesh", "city": "Ballia", "lat": 25.7594, "lon": 84.1497},
    {"code": "UP-61", "state": "Uttar Pradesh", "city": "Ghazipur", "lat": 25.5866, "lon": 83.5770},
    {"code": "UP-62", "state": "Uttar Pradesh", "city": "Jaunpur", "lat": 25.7464, "lon": 82.6837},
    {"code": "UP-63", "state": "Uttar Pradesh", "city": "Mirzapur", "lat": 25.1337, "lon": 82.5644},
    {"code": "UP-64", "state": "Uttar Pradesh", "city": "Sonbhadra", "lat": 24.6854, "lon": 83.0645},
    {"code": "UP-65", "state": "Uttar Pradesh", "city": "Varanasi", "lat": 25.3176, "lon": 82.9739},
    {"code": "UP-65A", "state": "Uttar Pradesh", "city": "Varanasi Outer", "lat": 25.3400, "lon": 83.0100},
    {"code": "UP-66", "state": "Uttar Pradesh", "city": "Bhadohi", "lat": 25.3944, "lon": 82.5707},
    {"code": "UP-67", "state": "Uttar Pradesh", "city": "Chandauli", "lat": 25.2612, "lon": 83.2661},
    {"code": "UP-70", "state": "Uttar Pradesh", "city": "Prayagraj", "lat": 25.4358, "lon": 81.8463},
    {"code": "UP-71", "state": "Uttar Pradesh", "city": "Fatehpur", "lat": 25.9272, "lon": 80.8129},
    {"code": "UP-72", "state": "Uttar Pradesh", "city": "Pratapgarh", "lat": 25.8966, "lon": 81.9448},
    {"code": "UP-73", "state": "Uttar Pradesh", "city": "Kaushambi", "lat": 25.5342, "lon": 81.4011},
    {"code": "UP-74", "state": "Uttar Pradesh", "city": "Kannauj", "lat": 27.0544, "lon": 79.9199},
    {"code": "UP-75", "state": "Uttar Pradesh", "city": "Etawah", "lat": 26.7855, "lon": 79.0154},
    {"code": "UP-76", "state": "Uttar Pradesh", "city": "Farrukhabad", "lat": 27.3826, "lon": 79.5847},
    {"code": "UP-77", "state": "Uttar Pradesh", "city": "Kanpur Dehat", "lat": 26.4385, "lon": 79.9547},
    {"code": "UP-78", "state": "Uttar Pradesh", "city": "Kanpur Nagar", "lat": 26.4499, "lon": 80.3319},
    {"code": "UP-79", "state": "Uttar Pradesh", "city": "Auraiya", "lat": 26.4673, "lon": 79.5165},
    {"code": "UP-80", "state": "Uttar Pradesh", "city": "Agra", "lat": 27.1767, "lon": 78.0081},
    {"code": "UP-81", "state": "Uttar Pradesh", "city": "Aligarh", "lat": 27.8974, "lon": 78.0880},
    {"code": "UP-82", "state": "Uttar Pradesh", "city": "Etah", "lat": 27.5583, "lon": 78.6631},

    # Page 7
    {"code": "UP-83", "state": "Uttar Pradesh", "city": "Firozabad", "lat": 27.1593, "lon": 78.3957},
    {"code": "UP-84", "state": "Uttar Pradesh", "city": "Mainpuri", "lat": 27.2289, "lon": 79.0287},
    {"code": "UP-85", "state": "Uttar Pradesh", "city": "Mathura", "lat": 27.4924, "lon": 77.6737},
    {"code": "UP-86", "state": "Uttar Pradesh", "city": "Hathras", "lat": 27.5969, "lon": 78.0519},
    {"code": "UP-87", "state": "Uttar Pradesh", "city": "Kasganj", "lat": 27.8080, "lon": 78.6469},
    {"code": "UP-90", "state": "Uttar Pradesh", "city": "Banda", "lat": 25.4756, "lon": 80.3347},
    {"code": "UP-91", "state": "Uttar Pradesh", "city": "Hamirpur", "lat": 25.9554, "lon": 80.1506},
    {"code": "UP-92", "state": "Uttar Pradesh", "city": "Jalaun", "lat": 26.1444, "lon": 79.3519},
    {"code": "UP-93", "state": "Uttar Pradesh", "city": "Jhansi", "lat": 25.4484, "lon": 78.5685},
    {"code": "UP-94", "state": "Uttar Pradesh", "city": "Lalitpur", "lat": 24.6896, "lon": 78.4116},
    {"code": "UP-95", "state": "Uttar Pradesh", "city": "Mahoba", "lat": 25.2926, "lon": 79.8722},
    {"code": "UP-96", "state": "Uttar Pradesh", "city": "Chitrakoot", "lat": 25.1763, "lon": 80.8653},
    # Uttarakhand - UK
    {"code": "UK-01", "state": "Uttarakhand", "city": "Almora", "lat": 29.5971, "lon": 79.6591},
    {"code": "UK-04", "state": "Uttarakhand", "city": "Nainital / Haldwani", "lat": 29.2183, "lon": 79.5130},
    {"code": "UK-07", "state": "Uttarakhand", "city": "Dehradun", "lat": 30.3165, "lon": 78.0322},
    {"code": "UK-08", "state": "Uttarakhand", "city": "Haridwar", "lat": 29.9457, "lon": 78.1642},
    {"code": "UK-12", "state": "Uttarakhand", "city": "Pauri Garhwal", "lat": 30.1477, "lon": 78.7808},
    # West Bengal - WB
    {"code": "WB-01", "state": "West Bengal", "city": "Kolkata Central", "lat": 22.5726, "lon": 88.3639},
    {"code": "WB-02", "state": "West Bengal", "city": "Kolkata North", "lat": 22.6480, "lon": 88.3800},
    {"code": "WB-06", "state": "West Bengal", "city": "Howrah", "lat": 22.5958, "lon": 88.2636},
    {"code": "WB-24", "state": "West Bengal", "city": "South 24 Parganas", "lat": 22.5200, "lon": 88.3300},
    {"code": "WB-38", "state": "West Bengal", "city": "Burdwan", "lat": 23.2324, "lon": 87.8615},
]

print(f"Total RTO codes parsed: {len(RTO_DATA)}")

# 1. Base cameras (existing Ghaziabad / Dasna CAM-01 to CAM-12)
cameras = [
    { "id": "CAM-01", "name": "Dasna Toll Plaza - NH-9 / DME", "latitude": 28.6792, "longitude": 77.5315, "direction": "E", "status": "ONLINE", "videoSource": "videos/CAM-01.mp4" },
    { "id": "CAM-02", "name": "Eastern Peripheral Interchange - Dasna", "latitude": 28.6835, "longitude": 77.5420, "direction": "NE", "status": "ONLINE", "videoSource": "videos/CAM-02.mp4" },
    { "id": "CAM-03", "name": "Dasna Flyover - Hapur Road", "latitude": 28.6755, "longitude": 77.5210, "direction": "W", "status": "ONLINE", "videoSource": "videos/CAM-03.mp4" },
    { "id": "CAM-04", "name": "IMS Ghaziabad UC Campus - NH-9", "latitude": 28.6710, "longitude": 77.5095, "direction": "SW", "status": "ONLINE", "videoSource": "videos/CAM-04.mp4" },
    { "id": "CAM-05", "name": "Wave City Main Entrance", "latitude": 28.6625, "longitude": 77.4980, "direction": "S", "status": "ONLINE", "videoSource": "videos/CAM-05.mp4" },
    { "id": "CAM-06", "name": "Govindpuram Checkpost", "latitude": 28.6880, "longitude": 77.4850, "direction": "NW", "status": "ONLINE", "videoSource": "videos/CAM-06.mp4" },
    { "id": "CAM-07", "name": "Masuri Police Chowki - NH-9", "latitude": 28.6850, "longitude": 77.5620, "direction": "E", "status": "ONLINE", "videoSource": "videos/CAM-07.mp4" },
    { "id": "CAM-08", "name": "Dasna Railway Crossing", "latitude": 28.6815, "longitude": 77.5185, "direction": "N", "status": "ONLINE", "videoSource": "videos/CAM-08.mp4" },
    { "id": "CAM-09", "name": "Lal Kuan Junction - GT Road", "latitude": 28.6490, "longitude": 77.4610, "direction": "W", "status": "PROCESSING", "videoSource": "videos/CAM-09.mp4" },
    { "id": "CAM-10", "name": "Pilkhuwa Toll Approach - NH-9 East", "latitude": 28.6980, "longitude": 77.5950, "direction": "E", "status": "ONLINE", "videoSource": "videos/CAM-10.mp4" },
    { "id": "CAM-11", "name": "EPE Toll Plaza South - Dasna Link", "latitude": 28.6520, "longitude": 77.5480, "direction": "SE", "status": "ONLINE", "videoSource": "videos/CAM-11.mp4" },
    { "id": "CAM-12", "name": "Ghaziabad Outer Ring Junction", "latitude": 28.6920, "longitude": 77.5120, "direction": "SE", "status": "OFFLINE", "videoSource": "videos/CAM-11.mp4" },
]

seen_cam_ids = {c["id"] for c in cameras}
videos_list = [f"videos/CAM-{i:02d}.mp4" for i in range(1, 12)]

rto_directory_dict = {}

# Also add state code generic fallbacks
state_groups = {}

for rto in RTO_DATA:
    code = rto["code"]
    code_clean = code.replace("-", "").upper()
    city = rto["city"]
    state = rto["state"]
    base_lat = rto["lat"]
    base_lon = rto["lon"]

    prefixes = [f"CAM-{code_clean}-"]
    if code_clean == "UP14":
        prefixes.extend(["CAM-0", "CAM-1"])

    rto_directory_dict[code_clean] = {
        "code": code,
        "state": state,
        "city": city,
        "center": [round(base_lon, 4), round(base_lat, 4)],
        "zoom": 12.4,
        "camIdPrefixes": prefixes,
    }

    state_prefix = code_clean[:2]
    if state_prefix not in state_groups:
        state_groups[state_prefix] = rto_directory_dict[code_clean]

    # Generate 4 distinct camera corridor nodes for each RTO
    offsets = [
        (0.0000, 0.0000, "Central Junction", "N"),
        (0.0125, 0.0142, "Highway Bypass Toll", "SE"),
        (-0.0118, -0.0135, "Ring Road Flyover", "W"),
        (0.0210, -0.0165, "Outer Expressway Link", "NE"),
    ]

    for idx, (d_lat, d_lon, feature, direction) in enumerate(offsets, start=1):
        cam_id = f"CAM-{code_clean}-{idx:02d}"
        if cam_id in seen_cam_ids:
            continue
        seen_cam_ids.add(cam_id)

        cam_lat = round(base_lat + d_lat, 4)
        cam_lon = round(base_lon + d_lon, 4)
        v_idx = (len(cameras)) % len(videos_list)

        cameras.append({
            "id": cam_id,
            "name": f"{city} {feature} - {code}",
            "latitude": cam_lat,
            "longitude": cam_lon,
            "direction": direction,
            "status": "ONLINE",
            "videoSource": videos_list[v_idx],
        })

print(f"Total cameras generated: {len(cameras)}")

# Write to data/cameras.json
cameras_file = REPO_ROOT / "data" / "cameras.json"
with open(cameras_file, "w", encoding="utf-8") as f:
    json.dump(cameras, f, indent=2)
print(f"Updated {cameras_file}")

# Write to frontend/public/data/cameras.json
pub_cameras_file = REPO_ROOT / "frontend" / "public" / "data" / "cameras.json"
pub_cameras_file.parent.mkdir(parents=True, exist_ok=True)
with open(pub_cameras_file, "w", encoding="utf-8") as f:
    json.dump(cameras, f, indent=2)
print(f"Updated {pub_cameras_file}")

# Write to frontend/src/lib/rtoDirectory.ts
rto_dir_file = REPO_ROOT / "frontend" / "src" / "lib" / "rtoDirectory.ts"

ts_content = '''export interface RtoAreaInfo {
  code: string;
  state: string;
  city: string;
  center: [number, number]; // [lng, lat] for MapLibre
  zoom: number;
  camIdPrefixes: string[];
}

export const RTO_DIRECTORY: Record<string, RtoAreaInfo> = ''' + json.dumps(rto_directory_dict, indent=2) + ''';

/** Whole India panoramic overview coordinates */
export const WHOLE_INDIA_CENTER: [number, number] = [78.9629, 21.5];
export const WHOLE_INDIA_ZOOM = 4.4;

/**
 * Parses raw plate string to find matching RTO Area
 */
export function resolveRtoArea(plate: string): RtoAreaInfo | null {
  if (!plate) return null;
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length < 2) return null;

  // 1. Direct 4-char match (e.g. UP14, UP32, BR01, MH12, KA51, RJ14)
  if (clean.length >= 4) {
    const code4 = clean.substring(0, 4);
    if (RTO_DIRECTORY[code4]) return RTO_DIRECTORY[code4];
  }

  // 2. Direct 2-char match (e.g. DL, CH, etc.)
  const code2 = clean.substring(0, 2);
  if (RTO_DIRECTORY[code2]) return RTO_DIRECTORY[code2];

  // 3. Match 3-char if any like UP32A
  if (clean.length >= 5) {
    const code5 = clean.substring(0, 5);
    if (RTO_DIRECTORY[code5]) return RTO_DIRECTORY[code5];
  }

  // 4. Fallback matching for state prefix if specific RTO not individually mapped
  for (const [key, info] of Object.entries(RTO_DIRECTORY)) {
    if (key.startsWith(code2)) {
      return info;
    }
  }

  return null;
}
'''

with open(rto_dir_file, "w", encoding="utf-8") as f:
    f.write(ts_content)
print(f"Updated {rto_dir_file}")
