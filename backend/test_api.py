import requests

base_url = 'http://127.0.0.1:8000/api/analyze'

def test1():
    files = [
        ('files', ('sales_usd.csv', open('../sample_data/sales_usd.csv', 'rb'), 'text/csv')),
        ('files', ('sales_eur.csv', open('../sample_data/sales_eur.csv', 'rb'), 'text/csv')),
    ]
    data = {'question': 'What is the total revenue across all sales?'}
    r = requests.post(base_url, files=files, data=data)
    print("Test 1 Result:", r.json())

def test2():
    files = [
        ('files', ('inventory.csv', open('../sample_data/inventory.csv', 'rb'), 'text/csv')),
    ]
    data = {'question': 'Which product appears most frequently in inventory?'}
    r = requests.post(base_url, files=files, data=data)
    print("Test 2 Result:", r.json())

def test3():
    files = [
        ('files', ('inventory.csv', open('../sample_data/inventory.csv', 'rb'), 'text/csv')),
    ]
    data = {'question': 'What is the average price of in-stock items?'}
    r = requests.post(base_url, files=files, data=data)
    print("Test 3 Result:", r.json())

if __name__ == '__main__':
    test1()
    test2()
    test3()
