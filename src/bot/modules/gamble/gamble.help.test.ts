import { describe, it, expect } from 'vitest';
import {
  HELP_CATEGORIES,
  renderHelpEmbed,
  renderHelpComponents,
  renderDevHelpEmbed,
  HelpSession,
} from './gamble.help';

describe('GambleHelp', () => {
  it('should have 7 valid categories with bilingual text', () => {
    expect(HELP_CATEGORIES.length).toBe(7);
    for (const cat of HELP_CATEGORIES) {
      expect(cat.id).toBeDefined();
      expect(cat.icon).toBeDefined();
      expect(cat.title.ID).toBeTruthy();
      expect(cat.title.EN).toBeTruthy();
      expect(cat.dropdownLabel.ID).toBeTruthy();
      expect(cat.dropdownLabel.EN).toBeTruthy();
      expect(cat.dropdownDesc.ID).toBeTruthy();
      expect(cat.dropdownDesc.EN).toBeTruthy();
      expect(cat.content.ID).toBeTruthy();
      expect(cat.content.EN).toBeTruthy();
    }
  });

  describe('renderHelpEmbed', () => {
    it('should render Indonesian embed correctly', () => {
      const session: HelpSession = {
        sessionId: 'sess1',
        userId: 'u1',
        currentPage: 0,
        language: 'ID',
        lastActive: Date.now(),
      };

      const embed = renderHelpEmbed(session, null);
      expect(embed.data.title).toBe(HELP_CATEGORIES[0].title.ID);
      expect(embed.data.description).toBe(HELP_CATEGORIES[0].content.ID);
      expect(embed.data.footer?.text).toContain('Halaman 1 / 7');
      expect(embed.data.footer?.text).toContain('Bahasa: 🇮🇩 ID');
    });

    it('should render English embed correctly', () => {
      const session: HelpSession = {
        sessionId: 'sess2',
        userId: 'u1',
        currentPage: 3,
        language: 'EN',
        lastActive: Date.now(),
      };

      const embed = renderHelpEmbed(session, null);
      expect(embed.data.title).toBe(HELP_CATEGORIES[3].title.EN);
      expect(embed.data.description).toBe(HELP_CATEGORIES[3].content.EN);
      expect(embed.data.footer?.text).toContain('Page 4 / 7');
      expect(embed.data.footer?.text).toContain('Language: 🇬🇧 EN');
    });
  });

  describe('renderHelpComponents', () => {
    it('should disable previous button on first page', () => {
      const session: HelpSession = {
        sessionId: 'sess3',
        userId: 'u1',
        currentPage: 0,
        language: 'ID',
        lastActive: Date.now(),
      };

      const [row1, row2] = renderHelpComponents(session);
      expect(row1.components.length).toBe(1); // SelectMenu
      expect(row2.components.length).toBe(3); // Prev, Lang, Next

      const prevBtn = row2.components[0] as any;
      const nextBtn = row2.components[2] as any;
      expect(prevBtn.data.disabled).toBe(true);
      expect(nextBtn.data.disabled).toBe(false);
    });

    it('should disable next button on last page', () => {
      const session: HelpSession = {
        sessionId: 'sess4',
        userId: 'u1',
        currentPage: 6,
        language: 'EN',
        lastActive: Date.now(),
      };

      const [row1, row2] = renderHelpComponents(session);
      const prevBtn = row2.components[0] as any;
      const nextBtn = row2.components[2] as any;
      expect(prevBtn.data.disabled).toBe(false);
      expect(nextBtn.data.disabled).toBe(true);
    });
  });

  describe('renderDevHelpEmbed', () => {
    it('should render developer cheat-sheet embed with dev commands', () => {
      const embed = renderDevHelpEmbed(null, 'Developer');
      expect(embed.data.title).toContain('DEVELOPER');
      expect(embed.data.description).toContain('caddcash');
      expect(embed.data.description).toContain('csetcash');
      expect(embed.data.description).toContain('cdec');
      expect(embed.data.description).toContain('creset');
      expect(embed.data.description).toContain('cgw');
    });
  });
});
