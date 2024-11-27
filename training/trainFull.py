import os
import tensorflow as tf
from object_detection.utils import label_map_util
from object_detection.utils import config_util
from object_detection.builders import model_builder
from object_detection.utils import dataset_util

# Set paths to the model config, label map, and TFRecord files
pipeline_config_path = './baseModel/pipeline.config'
model_dir = './trainedModel'
label_map_path = './data/train/fish-cCef_label_map.pbtxt'
train_record_path = './data/train/fish-cCef.tfrecord'
val_record_path = './data/valid/fish-cCef.tfrecord'

# Set training parameters
num_classes = 2  # Adjust based on your dataset
batch_size = 4   # Adjust based on your hardware
num_steps = 10000  # Number of training steps

# Load pipeline config
configs = config_util.get_configs_from_pipeline_file(pipeline_config_path)
model_config = configs['model']
train_config = configs['train_config']
train_input_config = configs['train_input_config']
eval_input_config = configs['eval_input_config']

# Build model
detection_model = model_builder.build(model_config=model_config, is_training=True)

def get_model_train_input_fn(tfrecord_path, batch_size):
    """Returns input function that would feed the model during training"""
    def train_input_fn():
        dataset = tf.data.TFRecordDataset(tfrecord_path)
        dataset = dataset.map(lambda x: dataset_util.tf_example_decoder(x, label_map_path))
        dataset = dataset.shuffle(1024).batch(batch_size).repeat()
        return dataset
    return train_input_fn

train_input_fn = get_model_train_input_fn(train_record_path, batch_size)

# Set up a training pipeline
optimizer = tf.compat.v2.optimizers.Adam(learning_rate=0.001)
train_step_counter = tf.Variable(0, trainable=False)

def get_model_train_step_function(model, optimizer):
    """Get a tf.function for training step."""
    @tf.function
    def train_step(detection_model, features, labels):
        with tf.GradientTape() as tape:
            # Forward pass
            preprocessed_images = tf.concat([features['image'] for features in features], axis=0)
            model_outputs = model(preprocessed_images, training=True)
            # Compute loss
            losses_dict = model.compute_loss(model_outputs, features, labels)
            total_loss = losses_dict['Loss/localization_loss'] + losses_dict['Loss/classification_loss']
            # Backward pass
            gradients = tape.gradient(total_loss, model.trainable_variables)
            optimizer.apply_gradients(zip(gradients, model.trainable_variables))
            return total_loss
    return train_step

train_step_fn = get_model_train_step_function(detection_model, optimizer)

# Run training loop
print('Training the model...')
for idx, (features, labels) in enumerate(train_input_fn()):
    if idx > num_steps:
        break
    total_loss = train_step_fn(detection_model, features, labels)
    if idx % 100 == 0:
        print('Step {}: Total loss {}'.format(idx, total_loss.numpy()))

# Save the trained model
detection_model.save(model_dir)
