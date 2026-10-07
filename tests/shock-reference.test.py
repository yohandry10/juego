"""Reference semantics: carry-in, threshold, continuation, gap and bad observations."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('shock_reference', Path(__file__).resolve().parents[1] / 'scripts/update-shock-reference.py')
reference = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reference)


class PriceReferenceTest(unittest.TestCase):
    def test_episodes_exclude_carry_in_and_group_contiguous_years(self):
        values = {1998: 100, 1999: 125, 2000: 160, 2001: 200, 2002: 210, 2003: 270, 2004: 350}
        rows = reference.price_episodes(values, 2000, 2004)
        self.assertEqual([r['year'] for r in rows if r['episodeStart']], [2003])
        self.assertTrue(rows[0]['aboveThreshold'])
        self.assertFalse(rows[0]['episodeStart'])
        for invalid in [{k: v for k, v in values.items() if k != 2002}, {**values, 2002: float('nan')}, {**values, 2002: 0}]:
            with self.assertRaises(ValueError):
                reference.price_episodes(invalid, 2000, 2004)


if __name__ == '__main__':
    unittest.main()
