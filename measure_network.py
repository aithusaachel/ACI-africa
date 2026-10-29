import subprocess, time, json, requests, websocket, os

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

def audit_performance(mode="desktop"):
    # mode: "desktop" or "mobile_savedata"
    args = [
        chrome,
        '--headless=new',
        '--disable-gpu',
        '--remote-debugging-port=9222',
        '--remote-allow-origins=*',
        'about:blank'
    ]
    proc = subprocess.Popen(args)
    try:
        time.sleep(1.5)
        targets = requests.get('http://127.0.0.1:9222/json').json()
        target = [t for t in targets if t.get('type') == 'page'][0]
        ws = websocket.create_connection(target['webSocketDebuggerUrl'])
        
        # 1. Enable domains
        ws.send(json.dumps({'id': 1, 'method': 'Network.enable'}))
        ws.recv()
        ws.send(json.dumps({'id': 2, 'method': 'Page.enable'}))
        ws.recv()
        ws.send(json.dumps({'id': 3, 'method': 'Performance.enable'}))
        ws.recv()
        
        if mode == "mobile_savedata":
            # 390 x 844 iPhone viewport
            ws.send(json.dumps({
                'id': 4,
                'method': 'Emulation.setDeviceMetricsOverride',
                'params': {'width': 390, 'height': 844, 'deviceScaleFactor': 3, 'mobile': True}
            }))
            ws.recv()
            # Send Save-Data header
            ws.send(json.dumps({
                'id': 5,
                'method': 'Network.setExtraHTTPHeaders',
                'params': {'headers': {'Save-Data': 'on'}}
            }))
            ws.recv()
        else:
            # 1440 x 900 Desktop viewport
            ws.send(json.dumps({
                'id': 4,
                'method': 'Emulation.setDeviceMetricsOverride',
                'params': {'width': 1440, 'height': 900, 'deviceScaleFactor': 1, 'mobile': False}
            }))
            ws.recv()

        # Disable cache to get true fresh cold-load transfer sizes
        ws.send(json.dumps({'id': 6, 'method': 'Network.setCacheDisabled', 'params': {'cacheDisabled': True}}))
        ws.recv()

        # Track requests
        requests_dict = {}

        # Navigate
        ws.send(json.dumps({'id': 7, 'method': 'Page.navigate', 'params': {'url': 'http://localhost:8080/index.html'}}))
        
        start_time = time.time()
        # Collect for 4.5 seconds
        while time.time() - start_time < 4.5:
            try:
                raw = ws.recv()
                msg = json.loads(raw)
                method = msg.get('method', '')
                
                if method == 'Network.requestWillBeSent':
                    req = msg['params']['request']
                    req_id = msg['params']['requestId']
                    requests_dict[req_id] = {
                        'url': req['url'],
                        'type': msg['params'].get('type', 'Other'),
                        'encoded_bytes': 0,
                        'mime': ''
                    }
                elif method == 'Network.responseReceived':
                    req_id = msg['params']['requestId']
                    res = msg['params']['response']
                    if req_id in requests_dict:
                        requests_dict[req_id]['mime'] = res.get('mimeType', '')
                        requests_dict[req_id]['status'] = res.get('status', 0)
                elif method == 'Network.dataReceived':
                    req_id = msg['params']['requestId']
                    data_len = msg['params'].get('dataLength', 0)
                    encoded_len = msg['params'].get('encodedDataLength', 0)
                    if req_id in requests_dict:
                        requests_dict[req_id]['encoded_bytes'] += encoded_len
                elif method == 'Network.loadingFinished':
                    req_id = msg['params']['requestId']
                    enc = msg['params'].get('encodedDataLength', 0)
                    if req_id in requests_dict and enc > requests_dict[req_id]['encoded_bytes']:
                        requests_dict[req_id]['encoded_bytes'] = enc
            except Exception:
                pass
                
        # Evaluate CLS
        cls_script = """
        (() => {
            return new Promise((resolve) => {
                let cls = 0;
                new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        if (!entry.hadRecentInput) {
                            cls += entry.value;
                        }
                    }
                }).observe({type: 'layout-shift', buffered: true});
                setTimeout(() => resolve(cls), 300);
            });
        })()
        """
        ws.send(json.dumps({
            'id': 8,
            'method': 'Runtime.evaluate',
            'params': {'expression': cls_script, 'awaitPromise': True}
        }))
        cls_val = 0.0
        while True:
            r = json.loads(ws.recv())
            if r.get('id') == 8:
                cls_val = r.get('result', {}).get('result', {}).get('value', 0.0)
                break
                
        ws.close()
        return cls_val, requests_dict
    finally:
        proc.terminate()
        proc.wait()

print("--- AUDITING DESKTOP ---")
d_cls, d_reqs = audit_performance("desktop")
print(f"Desktop CLS: {d_cls:.4f}")

d_total_bytes = 0
d_by_type = {}
for rid, rdata in d_reqs.items():
    if not rdata['url'].startswith('http://localhost:8080'):
        continue
    b = rdata['encoded_bytes']
    t = rdata['type']
    d_total_bytes += b
    d_by_type[t] = d_by_type.get(t, 0) + b
    url_base = rdata['url'].split('/')[-1]
    print(f"  [{t}] {url_base}: {b:,} bytes")

print(f"Desktop Total Transferred: {d_total_bytes:,} bytes ({d_total_bytes / (1024*1024):.2f} MB)")
print(f"Desktop Budget: 2.42 MB ({int(2.42 * 1024 * 1024):,} bytes)")
print("Desktop Pass:", "PASS" if d_total_bytes <= 2.42 * 1024 * 1024 else "FAIL")

print("\n--- AUDITING MOBILE (Save-Data) ---")
m_cls, m_reqs = audit_performance("mobile_savedata")
print(f"Mobile Save-Data CLS: {m_cls:.4f}")

m_total_bytes = 0
m_by_type = {}
for rid, rdata in m_reqs.items():
    if not rdata['url'].startswith('http://localhost:8080'):
        continue
    b = rdata['encoded_bytes']
    t = rdata['type']
    m_total_bytes += b
    m_by_type[t] = m_by_type.get(t, 0) + b
    url_base = rdata['url'].split('/')[-1]
    print(f"  [{t}] {url_base}: {b:,} bytes")

print(f"Mobile Total Transferred: {m_total_bytes:,} bytes ({m_total_bytes / 1024:.2f} KB)")
print(f"Mobile Budget: 276 KB ({int(276 * 1024):,} bytes)")
print("Mobile Pass:", "PASS" if m_total_bytes <= 276 * 1024 else "FAIL")
