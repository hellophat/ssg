# Example iframe embedding configurations

## Basic Profile Embed
```html
<iframe 
  src="https://YOUR_USERNAME.github.io/steam-profile-tracker/" 
  width="800" 
  height="600"
  frameborder="0"
  loading="lazy"
></iframe>
```

## Compact Dark Theme
```html
<iframe 
  src="https://YOUR_USERNAME.github.io/steam-profile-tracker/?theme=dark&compact=true" 
  width="800" 
  height="500"
  frameborder="0"
></iframe>
```

## Light Theme Stats Page
```html
<iframe 
  src="https://YOUR_USERNAME.github.io/steam-profile-tracker/stats/?theme=light" 
  width="900" 
  height="1000"
  frameborder="0"
></iframe>
```

## Headless Game Library (No Header/Footer)
```html
<iframe 
  src="https://YOUR_USERNAME.github.io/steam-profile-tracker/games/1/?hideHeader=true&compact=true" 
  width="100%" 
  height="800"
  frameborder="0"
></iframe>
```

## Filtered Games (Search)
```html
<iframe 
  src="https://YOUR_USERNAME.github.io/steam-profile-tracker/games/1/?filter=counter&sort=playtime" 
  width="800" 
  height="700"
  frameborder="0"
></iframe>
```

## Individual Game Page
```html
<iframe 
  src="https://YOUR_USERNAME.github.io/steam-profile-tracker/game/440/?theme=dark" 
  width="800" 
  height="900"
  frameborder="0"
></iframe>
```

## Responsive Full-Width Embed
```html
<div style="position: relative; width: 100%; padding-bottom: 75%; overflow: hidden;">
  <iframe 
    src="https://YOUR_USERNAME.github.io/steam-profile-tracker/" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    loading="lazy"
  ></iframe>
</div>
```

## Available URL Parameters

- `theme` - Set color theme: `dark`, `light`, or `auto`
- `compact` - Remove footer: `true` or `false`
- `hideHeader` - Hide navigation: `true` or `false`
- `page` - Start on specific page number: `1`, `2`, `3`, etc.
- `sort` - Sort games: `playtime`, `name`, or `recent`
- `filter` - Search/filter games: any search term

## Example Combinations

### Widget Style (Minimal)
```
?theme=dark&compact=true&hideHeader=true
```

### Embedded Library Browser
```
?theme=light&sort=name&page=1
```

### Achievement Showcase (Single Game)
```
/game/730/?theme=dark&hideHeader=true
```

## WordPress Shortcode Example

```php
[iframe src="https://YOUR_USERNAME.github.io/steam-profile-tracker/?theme=dark" width="100%" height="600"]
```

## Notion Embed

Just paste the URL and Notion will automatically create an embed:
```
https://YOUR_USERNAME.github.io/steam-profile-tracker/
```

## Security Notes

- The site allows embedding from any origin by default
- To restrict embedding, modify the CSP headers in `.github/workflows/build-site.yml`
- All data is public and loaded from the same domain
