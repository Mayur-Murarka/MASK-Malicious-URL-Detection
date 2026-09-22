import numpy as np
import sys
import logging
from src.exception import customException
from src.components.data_transformationComponents import transformationFunctions

logger = logging.getLogger(__name__)

class PredictPipeline:
    def __init__(self):
        self.tf = transformationFunctions()

    def transformURL(self, url):
        try:
            features = [
                self.tf.having_ip_address(url),
                self.tf.abnormal_url(url),
                self.tf.count_dot(url),
                self.tf.count_www(url),
                self.tf.count_atrate(url),
                self.tf.no_of_dir(url),
                self.tf.no_of_embed(url),
                self.tf.shortening_service(url),
                self.tf.count_https(url),
                self.tf.count_http(url),
                self.tf.count_per(url),
                self.tf.count_ques(url),
                self.tf.count_hyphen(url),
                self.tf.count_equal(url),
                self.tf.url_length(url),
                self.tf.hostname_length(url),
                self.tf.suspicious_words(url),
                self.tf.fd_length(url),
                self.tf.digit_count(url),
                self.tf.letter_count(url)
            ]

            # Ensure numeric dtype, replace NaN/Inf and return 1D float array
            arr = np.array(features, dtype=float)
            arr = np.nan_to_num(arr, nan=0.0, posinf=1e6, neginf=-1e6)
            return arr

        except Exception as e:
            logger.error(f"Error transforming URL {url}: {str(e)}")
            raise customException(e, sys)