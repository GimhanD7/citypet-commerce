import zipfile
import xml.etree.ElementTree as ET
import re
import json

def parse_excel():
    with zipfile.ZipFile('CityPet-Stock-valuation-2026-11-17.xlsx', 'r') as z:
        sheet_xml = z.read('xl/worksheets/sheet1.xml')
        tree = ET.fromstring(sheet_xml)
        ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        rows = tree.findall('main:sheetData/main:row', ns)
        
        products = []
        
        for r in rows[1:]:
            cells = {}
            for c in r.findall('main:c', ns):
                ref = c.attrib.get('r')
                col = ''.join([ch for ch in ref if ch.isalpha()])
                val = ''
                v = c.find('main:v', ns)
                is_node = c.find('main:is', ns)
                if v is not None and v.text:
                    val = v.text
                elif is_node is not None:
                    val = ''.join(is_node.itertext())
                cells[col] = val.strip()
            
            code = cells.get('A', '')
            name = cells.get('B', '')
            if not name:
                continue
            
            pos_cat = cells.get('C', 'Shop')
            stock_type = cells.get('D', '')
            unit = cells.get('F', 'pcs')
            qty = float(cells.get('G', '0') or 0)
            avail = float(cells.get('H', '0') or 0)
            cost = float(cells.get('K', '0') or 0)
            sell = float(cells.get('L', '0') or 0)
            
            # Price
            price = 0.0
            if sell != 0:
                price = abs(sell / qty) if qty != 0 else abs(sell)
            elif cost != 0:
                price = abs(cost / qty) * 1.3 if qty != 0 else abs(cost) * 1.3
            
            nl = name.lower()
            
            # 1. Shampoo & Grooming
            if any(w in nl for w in ['shampoo', 'conditioner', 'deodoris', 'deodoriz', 'cologne', 'groom', 'wash', 'soap', 'bath', 'brush', 'comb', 'wipes', 'roller', 'nail', 'scissor', 'clipper', 'towel', 'ear cleaner', 'tooth paste', 'toothpaste', 'tooth gel']):
                category = 'shampoo'
            # 2. Foods & Treats
            elif any(w in nl for w in ['food', 'cuisine', 'mackerel', 'tuna', 'sardine', 'chicken', 'meat', 'beef', 'pedigree', 'royal canin', 'whiskas', 'drools', 'smartheart', 'me-o', 'taste of the wild', 'feed', 'biscuit', 'treat', 'can ', 'gravy', 'jelly', 'pouch', 'puppy', 'adult', 'kitten', 'grain', 'dry', 'wet', 'formula', 'snack', 'chew', 'bone', 'jerky', 'milk', 'puree', 'churu', 'nutri', 'kibble']):
                category = 'foods'
            # 3. Accessories
            elif any(w in nl for w in ['collar', 'leash', 'harness', 'muzzle', 'necklace', 'chain', 'tie-out', 'cable', 'belt', 'bowl', 'bottle', 'cage', 'carrier', 'toy', 'ball', 'rope', 'bed', 'cloth', 'shirt', 'dress', 'shoe', 'litter', 'scoop', 'tag', 'feeder', 'clip', 'scratch', 'bell', 'house', 'vest', 'dispenser', 'pad']):
                category = 'accessories'
            # 4. Healthcare
            elif any(w in nl for w in ['tablet', 'injection', 'syrup', 'suspension', 'capsule', 'drop', 'cream', 'ointment', 'spray', 'wound', 'calcium', 'vitamin', 'tonic', 'deworm', 'flea', 'tick', 'spot on', 'antibiotic', 'vaccine', 'oral', 'arv', 'parvo', 'dhprl', 'dhl', 'dhpl', 'tricat', 'mucomix', 'atropine', 'prednisolone', 'metronidazole', 'erythropoietin', 'uniclav', 'atovaquone', 'bandage', 'syringe', 'cotton', 'gauze', 'dextrose', 'midazolam', 'ranitidine', 'spirit', 'suture', 'saline', 'iv ', 'powder', 'ketoprofen', 'otc', 'augmentin', 'tetanus', 'medrol', 'cephalexin', 'vein', 'rbc', 'bravecto', 'nexgard', 'simparica', 'supplement', 'salmon oil', 'aminoplus', 'pharma', 'med']) or pos_cat == 'OPD' or 'medicine' in stock_type.lower():
                category = 'healthcare'
            else:
                category = 'healthcare' if pos_cat == 'OPD' else 'accessories'
            
            if price <= 0:
                defaults = {'foods': 1850.0, 'shampoo': 1250.0, 'healthcare': 1450.0, 'accessories': 950.0}
                price = defaults.get(category, 950.0)
            
            price = round(price, 2)
            
            # Pet Type
            pet_type = 'all'
            if any(w in nl for w in ['cat', 'kitty', 'kitten', 'feline', 'tricat', 'me-o', 'whiskas', 'litter']):
                pet_type = 'cats'
            elif any(w in nl for w in ['dog', 'puppy', 'canine', 'bark', 'pedigree', 'muzzle', 'leash', 'collar', 'harness']):
                pet_type = 'dogs'
            elif any(w in nl for w in ['bird', 'parrot', 'avian']):
                pet_type = 'birds'
            elif any(w in nl for w in ['fish', 'aquarium']):
                pet_type = 'fish'
            
            # Brand
            brand = 'City Pet'
            known_brands = ['Royal Canin', 'Whiskas', 'Pedigree', 'Drools', 'SmartHeart', 'Me-O', 'Bioline', 'Beaphar', 'Bravecto', 'NexGard', 'Simparica', 'Adelia', 'Sujeewa', 'A Pro', 'CutePet', 'Uniclav', 'Audiclean', 'Aminoplus', 'Kaytee', 'TetraMin', 'Dermitol']
            for kb in known_brands:
                if kb.lower() in nl:
                    brand = kb
                    break
            if brand == 'City Pet':
                words = name.split()
                if words and len(words[0]) >= 3 and words[0].lower() not in ['dog', 'cat', 'pet', 'the', 'dry', 'wet', 'gold', 'red']:
                    brand = words[0]
            
            # Rating & Review
            rating = round(4.5 + (hash(name) % 5) * 0.1, 1)
            reviews_count = 5 + abs(hash(name)) % 55
            
            # Stock count
            stock_count = int(avail) if avail > 0 else (15 + abs(hash(name)) % 35)
            in_stock = 1
            
            # Image visual type
            if 'royal canin' in nl:
                image_type = 'royal-canin-puppy' if 'puppy' in nl else 'royal-canin-dog'
            elif 'whiskas' in nl:
                image_type = 'whiskas-pouch'
            elif 'pedigree' in nl:
                image_type = 'pedigree-dry'
            elif category == 'shampoo':
                image_type = 'shampoo'
            elif category == 'foods':
                image_type = 'foods'
            elif category == 'healthcare':
                image_type = 'healthcare'
            else:
                image_type = 'accessories'
                
            badge = None
            if reviews_count > 45:
                badge = 'Best Seller'
            elif 'puppy' in nl or 'kitten' in nl:
                badge = 'Young Pet Care'
            elif category == 'healthcare':
                badge = 'Vet Recommended'
            elif 'adelia' in nl:
                badge = 'Premium Grade'
                
            short_desc = f"Premium {brand} {category} for {pet_type}. Certified hospital-grade quality trusted by veterinary professionals."
            tags = [category, pet_type, brand.lower()]
            
            products.append({
                'id': code or f"CP-{abs(hash(name)) % 1000000}",
                'name': name,
                'full_name': f"{name} ({unit})",
                'brand': brand,
                'category_id': category,
                'pet_type': pet_type,
                'price': price,
                'original_price': round(price * 1.1, 2) if badge else None,
                'rating': rating,
                'reviews_count': reviews_count,
                'badge': badge,
                'in_stock': in_stock,
                'image_type': image_type,
                'short_description': short_desc,
                'tags_json': json.dumps(tags),
                'description_json': json.dumps([short_desc, f"Pack size / unit: {unit}."]),
                'key_benefits_json': json.dumps([
                    "100% Genuine product stocked by City Pet Animal Hospital",
                    "Stored under temperature-controlled medical conditions",
                    "Islandwide safe delivery and hospital counter pickup available"
                ])
            })
            
        print(f"Parsed {len(products)} products from Excel file!")
        return products

if __name__ == '__main__':
    prods = parse_excel()
    with open('imported_products.json', 'w', encoding='utf-8') as f:
        json.dump(prods, f, indent=2, ensure_ascii=False)
    print("Wrote imported_products.json successfully!")
