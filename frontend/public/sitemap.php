<?php
// Transparent sitemap proxy — fetches live data from backend (Render)
// Served at elegantize.com/sitemap.xml via .htaccess rewrite (no redirect)
$backendUrl = 'https://elegantize-zl57.onrender.com/sitemap.xml';

$context = stream_context_create([
    'http' => [
        'timeout' => 15,
        'header' => 'User-Agent: ElegantizeSitemapProxy/1.0',
    ],
]);

$xml = @file_get_contents($backendUrl, false, $context);

if ($xml === false) {
    http_response_code(503);
    header('Content-Type: text/plain');
    echo 'Sitemap temporarily unavailable.';
    exit;
}

header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: public, max-age=3600');
echo $xml;
