import unittest
import numpy as np
from effects import settings
from prosody import plan,phrase_config,synthesize,digital_artifacts

class FakeEngine:
    def __init__(self):self.calls=[]
    def create(self,text,**kwargs):
        self.calls.append((text,kwargs))
        return np.ones(2400,dtype=np.float32)*.1,24000

class ProsodyTest(unittest.TestCase):
    def test_digital_repeats_are_short_and_spaced_without_changing_duration(self):
        rate=24000;samples=(.2*np.sin(2*np.pi*220*np.arange(rate*22)/rate)).astype(np.float32)
        made,events=digital_artifacts(samples,rate,'mischief test')
        self.assertEqual(len(made),len(samples));self.assertTrue(events)
        self.assertTrue(3<=events[0]<=7)
        self.assertTrue(all(2.999<=b-a<=7.001 for a,b in zip(events,events[1:])))
        self.assertLess(np.count_nonzero(made!=samples)/len(samples),.03)
        np.testing.assert_array_equal(digital_artifacts(np.zeros_like(samples),rate,'silence')[0],np.zeros_like(samples))
    def test_phrase_budget_preserves_all_words(self):
        text='One. Two? Three! Four. Five.'
        delivery,phrases=plan(text,'playful')
        self.assertEqual(len(phrases),3)
        self.assertEqual(' '.join(p['text'] for p in phrases),text)
        self.assertEqual(phrases[-1]['pause'],0)
        self.assertTrue(all(p['pause']>0 for p in phrases[:-1]))

    def test_delivery_changes_timing_without_replacing_voice_identity(self):
        base=settings({'voice':'capri'})
        warm=phrase_config(base,plan('Take your time. I am here.','warm')[1][0])
        playful=phrase_config(base,plan('Well played. What next?','playful')[1][0])
        self.assertEqual(warm['voice'],'capri');self.assertEqual(playful['voice'],'capri')
        self.assertLess(warm['tempo']*warm['lift'],playful['tempo']*playful['lift'])
        self.assertLess(abs(warm['pitch']-3),.5)
        self.assertGreater(plan('Take your time. I am here.','warm')[1][0]['pause'],plan('Target acquired. Ready.','focused')[1][0]['pause'])

    def test_mischief_has_strong_contrasts_without_returning_to_uniform_fast_speech(self):
        text='There you are! Thought you could sneak past me? Come on, let us play.'
        delivery,phrases=plan(text)
        self.assertEqual(delivery,'mischievous')
        self.assertEqual(' '.join(p['text'] for p in phrases),text)
        self.assertLessEqual(len(phrases),3)
        self.assertGreater(max(p['pitch'] for p in phrases)-min(p['pitch'] for p in phrases),1.)
        self.assertGreater(max(p['pace'] for p in phrases)-min(p['pace'] for p in phrases),.15)
        self.assertTrue(all(p['pause']<=.20 for p in phrases))
        base=settings({'voice':'capri'})
        self.assertTrue(all(phrase_config(base,p)['voice']=='capri' for p in phrases))
        self.assertTrue(all(phrase_config(base,p)['tempo']*phrase_config(base,p)['lift']<1.10 for p in phrases))
        engine=FakeEngine();samples,_,_,_=synthesize(engine,text,np.zeros((510,1,256),dtype=np.float32),base,'mischievous')
        self.assertTrue(np.isfinite(samples).all());self.assertLessEqual(float(np.max(np.abs(samples))),.98001)

    def test_synthesis_joins_phrases_with_silence_and_bounded_calls(self):
        engine=FakeEngine();voice=np.zeros((510,1,256),dtype=np.float32)
        config=settings({'voice':'capri','layers':False})
        samples,rate,delivery,count=synthesize(engine,'Take your time. We can do this.',voice,config,'warm')
        self.assertEqual(count,2);self.assertEqual(len(engine.calls),2)
        self.assertTrue(all(call[1]['voice'] is voice for call in engine.calls))
        self.assertEqual(rate,24000);self.assertTrue(np.isfinite(samples).all())
        self.assertGreater(np.count_nonzero(samples==0),int(rate*.4))
        plain=FakeEngine();synthesize(plain,'One. Two. Three.',voice,config,'plain');self.assertEqual(len(plain.calls),1)
        with self.assertRaises(ValueError):plan('Hello.','not-a-style')

if __name__=='__main__':unittest.main()
