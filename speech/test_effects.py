import unittest
import numpy as np
from effects import settings,apply,resample_pitch,shimmer,limit

class VoiceEffectsTest(unittest.TestCase):
    def test_tuned_settings_compensate_tempo_for_pitch(self):
        config=settings({'voice':'capri'})
        self.assertAlmostEqual(config['tempo']*config['lift'],.95)
        self.assertEqual(config['pitch'],3)
        self.assertTrue(config['layers'])
        self.assertEqual(settings({'voice':'sharp'})['lang'],'en-gb')

    def test_plain_audio_is_unchanged_and_layers_are_finite(self):
        rate=24000
        original=(.2*np.sin(2*np.pi*220*np.arange(rate)/rate)).astype(np.float32)
        plain=apply(original,rate,settings({'voice':'af_bella'}))
        np.testing.assert_array_equal(plain,original)
        tuned=apply(original,rate,settings({'voice':'capri'}))
        self.assertTrue(np.isfinite(tuned).all())
        self.assertLessEqual(float(np.max(np.abs(tuned))),.98)
        self.assertLess(abs(len(tuned)-(len(original)/(2**.25)+rate*.025)),2)
        pitched=resample_pitch(original,2)
        dominant=np.argmax(np.abs(np.fft.rfft(pitched)))*rate/len(pitched)
        self.assertAlmostEqual(dominant,440,delta=3)

    def test_harmony_preserves_duration_and_shifts_frequency(self):
        rate=24000;original=(.2*np.sin(2*np.pi*440*np.arange(rate)/rate)).astype(np.float32)
        for semitones in (2,-2.5):
            shifted=shimmer(original,semitones,rate)
            self.assertEqual(len(shifted),len(original))
            core=shifted[2400:-2400]
            peak=np.argmax(np.abs(np.fft.rfft(core)))*rate/len(core)
            self.assertAlmostEqual(peak,440*2**(semitones/12),delta=5)
        quiet=limit(original,rate)
        np.testing.assert_array_equal(quiet,original)
        loud=original.copy();loud[12000:12500]*=10
        processed=limit(loud,rate)
        self.assertLessEqual(float(np.max(np.abs(processed))),.947)
        np.testing.assert_array_equal(processed[:10000],original[:10000])

    def test_bad_parameters_are_rejected(self):
        for value in [{'voice':'unknown'},{'voice':'capri','pitch':float('nan')},{'voice':'capri','speed':200},{'voice':'capri','layers':'yes'}]:
            with self.assertRaises(ValueError):settings(value)

if __name__=='__main__':unittest.main()
