from .testcase import TestCase
import ipywidgets as widgets
from traitlets import Unicode
from typing import Callable, Optional
from .output import StatefulOutput


@widgets.register('justitia.TestSuite')
class TestSuite(widgets.VBox):
    """"""
    _view_name = Unicode('TestSuiteView').tag(sync=True)
    _view_module = Unicode('justitia').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.on_msg(self._handle_run)

    def _handle_run(self, _, content, __):
        if content['event'] == 'run':
            for elem in self.children:
                if isinstance(elem, TestCase):
                    elem.run()


def testsuite(suite) -> Callable[[], TestSuite]:
    def fn():
        tcs = []

        def test_case(fn=None, **kwargs):
            def decorator(fn_):
                tc = TestCase(fn_, **kwargs) 
                tcs.append(tc)
                return fn_

            if fn is None:
                return decorator
            else:
                return decorator(fn)

        output = StatefulOutput()
        with output:
            suite(test_case)

        suite_widget = TestSuite(tcs)

        whole = widgets.VBox((output, suite_widget))

        return whole

    fn.__name__ = suite.__name__
    return fn

