class User < ApplicationRecord
  has_many :routes, dependent: :destroy
end
