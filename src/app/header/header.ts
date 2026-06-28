import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class Header {
  protected readonly brand = signal('ng-mcp');
  protected readonly navItems = signal<NavItem[]>([
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Docs', path: '/docs' },
    { label: 'Contact', path: '/contact' },
  ]);
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
